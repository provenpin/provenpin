import { DynamoDBClient, ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export type Order = { pk: string; sk: string; orderId: string; customerId: string; status: "pending" | "paid" | "shipped"; totalCents: number; version: number };

const creds = { accessKeyId: "AKIDEXAMPLE", secretAccessKey: "secret" };
export const makeClients = () => ({
  // The document client marshalls plain JS objects, so no { S: "..." } attribute maps in app code.
  ddb: DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1", credentials: creds }), { marshallOptions: { removeUndefinedValues: true } }),
  sqs: new SQSClient({ region: "us-east-1", credentials: creds }),
});

export class OrderService {
  constructor(private c: ReturnType<typeof makeClients>, private table = "app", private queueUrl = "https://sqs.us-east-1.amazonaws.com/123456789012/order-events") {}

  /** Single-table design: customer partition, order sort key. Refuses to overwrite an existing order. */
  async create(customerId: string, orderId: string, totalCents: number): Promise<Order> {
    const order: Order = { pk: `CUSTOMER#${customerId}`, sk: `ORDER#${orderId}`, orderId, customerId, status: "pending", totalCents, version: 1 };
    await this.c.ddb.send(new PutCommand({ TableName: this.table, Item: order, ConditionExpression: "attribute_not_exists(pk)" }));
    await this.publish("order.created", order);
    return order;
  }

  get(customerId: string, orderId: string) {
    return this.c.ddb.send(new GetCommand({ TableName: this.table, Key: { pk: `CUSTOMER#${customerId}`, sk: `ORDER#${orderId}` } })).then((r) => (r.Item as Order | undefined) ?? null);
  }

  async listForCustomer(customerId: string) {
    const r = await this.c.ddb.send(new QueryCommand({
      TableName: this.table,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: { ":pk": `CUSTOMER#${customerId}`, ":prefix": "ORDER#" },
      ScanIndexForward: false,
    }));
    return (r.Items ?? []) as Order[];
  }

  /** Optimistic locking: the update only applies if the version we read is still current. */
  async setStatus(order: Order, status: Order["status"]) {
    try {
      const r = await this.c.ddb.send(new UpdateCommand({
        TableName: this.table,
        Key: { pk: order.pk, sk: order.sk },
        UpdateExpression: "SET #s = :s, version = version + :one",
        ConditionExpression: "version = :v",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": status, ":v": order.version, ":one": 1 },
        ReturnValues: "ALL_NEW",
      }));
      const updated = r.Attributes as Order;
      await this.publish(`order.${status}`, updated);
      return updated;
    } catch (e) {
      if (e instanceof ConditionalCheckFailedException) return null; // someone else changed it first
      throw e;
    }
  }

  private publish(type: string, order: Order) {
    return this.c.sqs.send(new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify({ type, orderId: order.orderId, status: order.status }),
      MessageAttributes: { type: { DataType: "String", StringValue: type } },
    }));
  }
}

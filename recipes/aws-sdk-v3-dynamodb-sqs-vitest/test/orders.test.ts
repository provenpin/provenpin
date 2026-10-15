import { describe, it, expect, beforeEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-vitest/extend";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { OrderService, makeClients, type Order } from "../src/orders.ts";

// Mock the document client itself, so assertions see plain JS inputs rather than marshalled ones.
const ddbMock = mockClient(DynamoDBDocumentClient);
const sqsMock = mockClient(SQSClient);
const svc = () => new OrderService(makeClients());

beforeEach(() => { ddbMock.reset(); sqsMock.reset(); sqsMock.on(SendMessageCommand).resolves({ MessageId: "m-1" }); });

const order: Order = { pk: "CUSTOMER#c1", sk: "ORDER#o1", orderId: "o1", customerId: "c1", status: "pending", totalCents: 4200, version: 1 };

describe("OrderService", () => {
  it("creates with a conditional put and publishes an event", async () => {
    ddbMock.on(PutCommand).resolves({});
    await expect(svc().create("c1", "o1", 4200)).resolves.toEqual(order);
    expect(ddbMock).toHaveReceivedCommandWith(PutCommand, { TableName: "app", Item: order, ConditionExpression: "attribute_not_exists(pk)" });
    expect(sqsMock).toHaveReceivedCommandTimes(SendMessageCommand, 1);
    const body = JSON.parse(sqsMock.commandCalls(SendMessageCommand)[0].args[0].input.MessageBody!);
    expect(body).toEqual({ type: "order.created", orderId: "o1", status: "pending" });
  });

  it("does not publish when the put fails", async () => {
    ddbMock.on(PutCommand).rejects(new ConditionalCheckFailedException({ message: "exists", $metadata: {} }));
    await expect(svc().create("c1", "o1", 1)).rejects.toBeInstanceOf(ConditionalCheckFailedException);
    expect(sqsMock).not.toHaveReceivedCommand(SendMessageCommand);
  });

  it("gets by composite key and returns null when missing", async () => {
    // register the catch-all first: a later, more specific input match takes precedence
    ddbMock.on(GetCommand).resolves({});
    ddbMock.on(GetCommand, { Key: { pk: "CUSTOMER#c1", sk: "ORDER#o1" } }).resolves({ Item: order });
    expect(await svc().get("c1", "o1")).toEqual(order);
    expect(await svc().get("c1", "nope")).toBeNull();
  });

  it("queries a customer's orders newest first", async () => {
    ddbMock.on(QueryCommand).resolves({ Items: [order] });
    expect(await svc().listForCustomer("c1")).toHaveLength(1);
    expect(ddbMock).toHaveReceivedCommandWith(QueryCommand, {
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
      ExpressionAttributeValues: { ":pk": "CUSTOMER#c1", ":prefix": "ORDER#" },
      ScanIndexForward: false,
    });
  });

  it("updates status with optimistic locking", async () => {
    ddbMock.on(UpdateCommand).resolves({ Attributes: { ...order, status: "paid", version: 2 } });
    const updated = await svc().setStatus(order, "paid");
    expect(updated).toMatchObject({ status: "paid", version: 2 });
    expect(ddbMock).toHaveReceivedCommandWith(UpdateCommand, { ConditionExpression: "version = :v", ExpressionAttributeValues: { ":s": "paid", ":v": 1, ":one": 1 } });
    expect(sqsMock).toHaveReceivedCommandWith(SendMessageCommand, { MessageAttributes: { type: { DataType: "String", StringValue: "order.paid" } } });
  });

  it("returns null on a version conflict and publishes nothing", async () => {
    ddbMock.on(UpdateCommand).rejects(new ConditionalCheckFailedException({ message: "stale", $metadata: {} }));
    expect(await svc().setStatus(order, "shipped")).toBeNull();
    expect(sqsMock).not.toHaveReceivedCommand(SendMessageCommand);
  });
});

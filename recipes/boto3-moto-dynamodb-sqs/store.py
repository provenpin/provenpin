import json
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

TABLE = "idempotency"
QUEUE = "orders"


def create_resources(region="us-east-1"):
    ddb = boto3.resource("dynamodb", region_name=region)
    table = ddb.create_table(
        TableName=TABLE,
        KeySchema=[{"AttributeName": "pk", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "pk", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    sqs = boto3.client("sqs", region_name=region)
    url = sqs.create_queue(QueueName=QUEUE)["QueueUrl"]
    return table, sqs, url


class OrderStore:
    def __init__(self, table, sqs, queue_url):
        self.table = table
        self.sqs = sqs
        self.url = queue_url

    def record_once(self, key: str, amount: Decimal) -> bool:
        """Return True on first write, False if the key already exists."""
        try:
            self.table.put_item(
                Item={"pk": key, "amount": amount},
                ConditionExpression="attribute_not_exists(pk)",
            )
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                return False
            raise

    def enqueue(self, payload: dict) -> None:
        self.sqs.send_message(QueueUrl=self.url, MessageBody=json.dumps(payload))

    def drain(self) -> list[dict]:
        out = []
        # An empty queue returns no "Messages" key at all, not an empty list.
        resp = self.sqs.receive_message(QueueUrl=self.url, MaxNumberOfMessages=10)
        for m in resp.get("Messages", []):
            out.append(json.loads(m["Body"]))
            self.sqs.delete_message(QueueUrl=self.url, ReceiptHandle=m["ReceiptHandle"])
        return out

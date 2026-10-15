from decimal import Decimal

import pytest
from moto import mock_aws

from store import OrderStore, create_resources


@pytest.fixture(autouse=True)
def aws(monkeypatch):
    # Fake credentials so boto3 never reads real ~/.aws config or hits the network.
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    # Clients must be created while mock_aws is active.
    with mock_aws():
        yield


@pytest.fixture
def store():
    table, sqs, url = create_resources()
    return OrderStore(table, sqs, url)


def test_conditional_put_is_idempotent(store):
    assert store.record_once("order-1", Decimal("9.99")) is True
    assert store.record_once("order-1", Decimal("1.00")) is False
    item = store.table.get_item(Key={"pk": "order-1"})["Item"]
    assert item["amount"] == Decimal("9.99")


def test_floats_are_rejected_use_decimal(store):
    # boto3's serializer refuses float; amounts must be Decimal.
    with pytest.raises(TypeError):
        store.record_once("order-2", 9.99)


def test_sqs_roundtrip_and_delete(store):
    store.enqueue({"id": 1})
    store.enqueue({"id": 2})
    assert sorted(m["id"] for m in store.drain()) == [1, 2]
    # Messages were deleted, so a second drain sees nothing.
    assert store.drain() == []


def test_empty_queue_returns_empty_list(store):
    assert store.drain() == []

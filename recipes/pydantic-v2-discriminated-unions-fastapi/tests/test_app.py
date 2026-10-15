from fastapi.testclient import TestClient

from app import app

client = TestClient(app)


def card(**overrides):
    return {"kind": "card", "number": "4111111111111111", **overrides}


def test_valid_card_and_bank():
    r = client.post("/orders", json={"amount": 500, "payment": card()})
    assert r.status_code == 200
    assert r.json() == {"ok": True, "kind": "card"}

    bank = {"kind": "bank", "iban": "DE89370400440532013000"}
    r = client.post("/orders", json={"amount": 5, "payment": bank})
    assert r.json()["kind"] == "bank"


def test_unknown_tag_is_422_union_tag_invalid():
    r = client.post("/orders", json={"amount": 1, "payment": {"kind": "crypto"}})
    assert r.status_code == 422
    err = r.json()["detail"][0]
    assert err["type"] == "union_tag_invalid"
    assert err["loc"][:2] == ["body", "payment"]


def test_missing_discriminator_is_union_tag_not_found():
    r = client.post("/orders", json={"amount": 1, "payment": {"number": "4111111111111111"}})
    assert r.status_code == 422
    assert r.json()["detail"][0]["type"] == "union_tag_not_found"


def test_branch_field_error_loc_includes_tag():
    r = client.post("/orders", json={"amount": 1, "payment": card(number="41x1")})
    err = r.json()["detail"][0]
    assert err["loc"] == ["body", "payment", "card", "number"]
    assert err["type"] == "string_pattern_mismatch"


def test_annotated_luhn_validator_runs_after_pattern():
    r = client.post("/orders", json={"amount": 1, "payment": card(number="4111111111111112")})
    err = r.json()["detail"][0]
    assert err["type"] == "value_error"
    assert "Luhn" in err["msg"]

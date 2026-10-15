import json
import httpx
import openai
import pytest
import respx
from openai import OpenAI
from extract import ExtractionError, extract_invoice

BASE = "https://api.openai.test/v1"

def completion(content: str):
    return {"id": "c1", "object": "chat.completion", "created": 0, "model": "gpt-4o-mini",
            "choices": [{"index": 0, "finish_reason": "stop", "message": {"role": "assistant", "content": content}}]}

@pytest.fixture
def client():
    # pass an httpx client explicitly so respx can intercept it
    return OpenAI(api_key="test", base_url=BASE, max_retries=0, http_client=httpx.Client())

@respx.mock
def test_parses_valid_json(client):
    route = respx.post(f"{BASE}/chat/completions").mock(return_value=httpx.Response(200, json=completion('{"vendor":"Acme","total":12.5,"currency":"USD"}')))
    inv = extract_invoice(client, "Acme invoice $12.50")
    assert inv.vendor == "Acme" and inv.total == 12.5
    sent = json.loads(route.calls.last.request.content)
    assert sent["response_format"] == {"type": "json_object"}

@respx.mock
def test_invalid_output_raises(client):
    respx.post(f"{BASE}/chat/completions").mock(return_value=httpx.Response(200, json=completion('{"vendor":"Acme"}')))
    with pytest.raises(ExtractionError):
        extract_invoice(client, "x")

@respx.mock
def test_api_errors_surface_as_sdk_exceptions(client):
    respx.post(f"{BASE}/chat/completions").mock(return_value=httpx.Response(429, json={"error": {"message": "slow down", "type": "rate_limit"}}))
    with pytest.raises(openai.RateLimitError):
        extract_invoice(client, "x")

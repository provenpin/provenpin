import json

import httpx, openai, pytest, respx
from openai import OpenAI
from client import ExtractError, Ticket, extract_ticket

URL = "https://api.openai.com/v1/chat/completions"

def completion(message: dict) -> httpx.Response:
    body = {
        "id": "c1", "object": "chat.completion", "created": 0, "model": "gpt-4o-mini",
        "choices": [{"index": 0, "finish_reason": "stop", "message": {"role": "assistant", **message}}],
    }
    return httpx.Response(200, json=body)

@pytest.fixture
def client():
    # pass an explicit classic httpx.Client so respx can intercept it; the SDK's
    # default client path is not routed through respx, which caused connection errors
    # max_retries=0: a mocked 5xx fails fast instead of sleeping through SDK backoff
    return OpenAI(api_key="test-key", max_retries=0, http_client=httpx.Client())

def test_parses_structured_output(client):
    content = json.dumps({"title": "Crash on save", "priority": "high", "estimate_hours": 3})
    with respx.mock:
        route = respx.post(URL).mock(return_value=completion({"content": content, "refusal": None}))
        ticket = extract_ticket(client, "app crashes when saving")
    assert ticket == Ticket(title="Crash on save", priority="high", estimate_hours=3)
    # the Pydantic class must be sent as a json_schema response_format, not as plain JSON mode
    sent = json.loads(route.calls.last.request.content)
    assert sent["response_format"]["type"] == "json_schema"
    assert sent["response_format"]["json_schema"]["name"] == "Ticket"

def test_refusal_raises(client):
    with respx.mock:
        respx.post(URL).mock(return_value=completion({"content": None, "refusal": "I can't help with that."}))
        with pytest.raises(ExtractError, match="refused"):
            extract_ticket(client, "something unsafe")

@pytest.mark.parametrize("content", [
    json.dumps({"title": "x", "priority": "urgent", "estimate_hours": 1}),  # value outside Literal
    json.dumps({"title": "x", "priority": "low"}),                         # missing required field
])
def test_validation_error_raises(client, content):
    with respx.mock:
        respx.post(URL).mock(return_value=completion({"content": content, "refusal": None}))
        with pytest.raises(ExtractError, match="did not match Ticket"):
            extract_ticket(client, "bad output")

def test_server_error_is_not_swallowed(client):
    with respx.mock:
        respx.post(URL).mock(return_value=httpx.Response(500, json={"error": {"message": "boom"}}))
        with pytest.raises(openai.InternalServerError):
            extract_ticket(client, "anything")

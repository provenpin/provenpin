from typing import Literal

from openai import OpenAI
from pydantic import BaseModel, ValidationError

class Ticket(BaseModel):
    title: str
    priority: Literal["low", "medium", "high"]
    estimate_hours: int

class ExtractError(Exception):
    pass

def extract_ticket(client: OpenAI, text: str, model: str = "gpt-4o-mini") -> Ticket:
    try:
        completion = client.chat.completions.parse(
            model=model,
            messages=[
                {"role": "system", "content": "Turn the bug report into a ticket."},
                {"role": "user", "content": text},
            ],
            response_format=Ticket,
        )
    except ValidationError as e:
        # the SDK validates the JSON content against Ticket and raises on mismatch
        raise ExtractError("model output did not match Ticket") from e
    msg = completion.choices[0].message
    # on refusal the SDK does not raise: parsed is None and refusal is set
    if msg.refusal:
        raise ExtractError(f"model refused: {msg.refusal}")
    if msg.parsed is None:
        raise ExtractError("no parsed output")
    return msg.parsed

from openai import OpenAI
from pydantic import BaseModel, ValidationError

class Invoice(BaseModel):
    vendor: str
    total: float
    currency: str

class ExtractionError(Exception):
    pass

def extract_invoice(client: OpenAI, text: str) -> Invoice:
    res = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "Extract vendor, total and currency as JSON."},
            {"role": "user", "content": text},
        ],
    )
    content = res.choices[0].message.content or ""
    try:
        return Invoice.model_validate_json(content)
    except ValidationError as e:
        raise ExtractionError(f"model returned invalid JSON: {e.error_count()} errors") from e

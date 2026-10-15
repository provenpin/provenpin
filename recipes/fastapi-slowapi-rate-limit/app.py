from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

def api_key_or_ip(request: Request) -> str:
    return request.headers.get("X-API-Key") or get_remote_address(request)

limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/ping")
@limiter.limit("3/minute")
def ping(request: Request):
    # slowapi needs the Request in the signature to read the client address
    return {"ok": True}

@app.get("/search")
@limiter.limit("2/minute", key_func=api_key_or_ip)
def search(request: Request, q: str = ""):
    return {"q": q}

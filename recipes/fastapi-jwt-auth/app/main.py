import os
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

SECRET = os.environ.get("JWT_SECRET", "dev-only-secret-change-me-32-bytes!!")
ALGO = "HS256"
oauth2 = OAuth2PasswordBearer(tokenUrl="token")
app = FastAPI()

def make_token(sub: str, minutes: int = 15) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return jwt.encode({"sub": sub, "exp": exp}, SECRET, algorithm=ALGO)

def current_user(token: str = Depends(oauth2)) -> str:
    try:
        return jwt.decode(token, SECRET, algorithms=[ALGO])["sub"]
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid token", headers={"WWW-Authenticate": "Bearer"})

@app.post("/token")
def login(form: OAuth2PasswordRequestForm = Depends()):
    if form.password != "correct-horse":
        raise HTTPException(400, "bad credentials")
    return {"access_token": make_token(form.username), "token_type": "bearer"}

@app.get("/me")
def me(user: str = Depends(current_user)):
    return {"user": user}

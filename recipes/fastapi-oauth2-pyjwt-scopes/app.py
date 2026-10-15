from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, FastAPI, HTTPException, Security, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, SecurityScopes
from pwdlib import PasswordHash
from pydantic import BaseModel

# Load these from the environment in production.
SECRET_KEY = "change-me-in-prod"
ALGORITHM = "HS256"
TOKEN_TTL = timedelta(minutes=15)

pwd = PasswordHash.recommended()  # Argon2 when argon2-cffi is installed
oauth2 = OAuth2PasswordBearer(
    tokenUrl="token",
    scopes={"me": "Read own profile", "items:write": "Create items"},
)

# In-memory user store for the demo; hashes are computed once at import.
USERS = {
    "alice": {"username": "alice", "hashed_password": pwd.hash("wonderland"), "scopes": ["me", "items:write"]},
    "bob": {"username": "bob", "hashed_password": pwd.hash("builder"), "scopes": ["me"]},
}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


def authenticate(username: str, password: str) -> dict | None:
    user = USERS.get(username)
    if user is None or not pwd.verify(password, user["hashed_password"]):
        return None
    return user


app = FastAPI()


@app.post("/token", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = authenticate(form.username, form.password)
    if user is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Grant only what was requested AND what the user is allowed to have.
    granted = [s for s in form.scopes if s in user["scopes"]]
    now = datetime.now(timezone.utc)
    payload = {"sub": user["username"], "scopes": granted, "iat": now, "exp": now + TOKEN_TTL}
    return Token(access_token=jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM))


def current_user(security_scopes: SecurityScopes, token: str = Depends(oauth2)) -> dict:
    challenge = f'Bearer scope="{security_scopes.scope_str}"' if security_scopes.scopes else "Bearer"
    try:
        # Pin the algorithm list; never trust the token's own "alg" header.
        claims = jwt.decode(
            token, SECRET_KEY, algorithms=[ALGORITHM], options={"require": ["exp", "sub"]}
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Could not validate credentials",
            headers={"WWW-Authenticate": challenge},
        )
    if not set(security_scopes.scopes) <= set(claims.get("scopes", [])):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Not enough permissions",
            headers={"WWW-Authenticate": challenge},
        )
    user = USERS.get(claims["sub"])
    if user is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Could not validate credentials",
            headers={"WWW-Authenticate": challenge},
        )
    return user


@app.get("/me")
def me(user: dict = Security(current_user, scopes=["me"])):
    return {"username": user["username"]}


@app.post("/items")
def create_item(name: str, user: dict = Security(current_user, scopes=["items:write"])):
    return {"name": name, "owner": user["username"]}

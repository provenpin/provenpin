from typing import Annotated

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import FastAPI, Form, HTTPException, status

# argon2id with library defaults. The cost parameters are stored inside every hash,
# so raising them later makes old hashes "need rehash" instead of breaking them.
ph = PasswordHasher()

# Verified against when the user does not exist, so both paths cost one argon2 run.
DUMMY_HASH = ph.hash("dummy-password-never-matches")

users: dict[str, str] = {}  # username -> argon2 hash (stand-in for a DB table)

app = FastAPI()


@app.post("/login")
def login(username: Annotated[str, Form()], password: Annotated[str, Form()]):
    # Plain `def`: FastAPI runs it in a threadpool, since argon2 is deliberately slow CPU work.
    hashed = users.get(username)
    try:
        ph.verify(hashed or DUMMY_HASH, password)
    except VerifyMismatchError:
        hashed = None
    if hashed is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid credentials")
    if ph.check_needs_rehash(hashed):
        # Only rehash after a successful login, when we know the plaintext is correct.
        users[username] = ph.hash(password)
    return {"username": username}

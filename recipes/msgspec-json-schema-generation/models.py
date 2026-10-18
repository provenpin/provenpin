from typing import Annotated, Union

import msgspec


class User(msgspec.Struct, tag="user"):
    name: Annotated[str, msgspec.Meta(min_length=1, max_length=50, pattern="^[a-z]+$")]
    age: Annotated[int, msgspec.Meta(ge=0, le=120)]
    nickname: str | None = None


class Team(msgspec.Struct, tag="team"):
    team_name: Annotated[str, msgspec.Meta(min_length=1)]
    members: list[str] = []


Message = Union[User, Team]


def user_schema() -> dict:
    return msgspec.json.schema(User)


def message_schema() -> dict:
    return msgspec.json.schema(Message)


def deref(schema: dict, node: dict) -> dict:
    ref = node.get("$ref")
    return schema["$defs"][ref.rsplit("/", 1)[-1]] if ref else node


def decode_message(payload: bytes) -> User | Team:
    return msgspec.json.decode(payload, type=Message)

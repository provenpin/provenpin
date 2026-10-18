from dataclasses import dataclass, field

import strawberry

@strawberry.type
class User:
    id: strawberry.ID
    name: str
    email: str

    @strawberry.field
    def display_name(self) -> str:
        # exposed as "displayName" in the schema by strawberry's auto camel-casing
        return self.name.title()

@strawberry.input
class CreateUserInput:
    name: str
    email: str

@dataclass
class Store:
    users: dict[str, User] = field(default_factory=dict)
    seq: int = 0

    def add(self, name: str, email: str) -> User:
        self.seq += 1
        user = User(id=strawberry.ID(str(self.seq)), name=name, email=email)
        self.users[str(self.seq)] = user
        return user

@strawberry.type
class Query:
    @strawberry.field
    def user(self, info: strawberry.Info[Store, None], id: strawberry.ID) -> User | None:
        return info.context.users.get(str(id))

    @strawberry.field
    async def users(self, info: strawberry.Info[Store, None]) -> list[User]:
        return list(info.context.users.values())

@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_user(self, info: strawberry.Info[Store, None], input: CreateUserInput) -> User:
        return info.context.add(input.name, input.email)

schema = strawberry.Schema(query=Query, mutation=Mutation)

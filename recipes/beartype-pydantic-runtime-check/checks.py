from beartype import BeartypeConf, beartype
from pydantic import BaseModel, ConfigDict, PositiveInt, TypeAdapter

# beartype rejects int where float is annotated, while pydantic coerces int to
# float. Enabling the PEP 484 tower makes beartype accept ints for floats.
TOWER = BeartypeConf(is_pep484_tower=True)


class SchemaError(TypeError):
    pass


# Route every beartype violation through one app exception so callers can catch
# schema errors with a single except clause alongside pydantic.ValidationError.
APP = BeartypeConf(is_pep484_tower=True, violation_param_type=SchemaError)


class Account(BaseModel):
    # revalidate_instances forces model_validate to re-check instances that
    # bypassed validation through model_construct.
    model_config = ConfigDict(revalidate_instances="always", extra="forbid")
    name: str
    balance: PositiveInt
    rate: float = 0.0


def parse_account(raw: object) -> Account:
    # The only place that coerces and enforces constraints such as PositiveInt.
    return Account.model_validate(raw)


positive_int = TypeAdapter(PositiveInt)


@beartype
def snapshot(account: Account) -> str:
    # beartype only checks the runtime class, it never builds an Account.
    return f"{account.name}:{account.balance}"


@beartype
def rate_of(rate: float) -> float:
    return rate


@beartype(conf=TOWER)
def rate_of_lax(rate: float) -> float:
    return rate


@beartype
def nominal(amount: PositiveInt) -> int:
    # beartype shaves Annotated down to int and drops the Gt(0) metadata.
    return amount


@beartype(conf=APP)
def credit(account: Account, amount: int) -> int:
    return account.balance + amount

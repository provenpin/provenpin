from datetime import datetime

from attrs import define, field, validators


def _non_negative(instance, attribute, value):
    if value < 0:
        raise ValueError(f"{attribute.name} must be >= 0, got {value}")


@define
class Job:
    job_id: int = field(validator=validators.instance_of(int))
    created_at: datetime
    # converter runs first, then validator sees the converted value
    attempts: int = field(default=0, converter=int, validator=_non_negative)
    tags: list[str] = field(factory=list)

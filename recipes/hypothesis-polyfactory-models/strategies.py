from typing import Annotated, Any

import hypothesis.strategies as st
from polyfactory.factories.pydantic_factory import ModelFactory


def field(factory: type[ModelFactory], name: str) -> st.SearchStrategy[Any]:
    # pydantic stores Field(ge=...) as Annotated metadata; rebuild it so
    # Hypothesis can generate values that actually satisfy the constraint.
    info = factory.__model__.model_fields[name]
    if info.metadata:
        return st.from_type(Annotated[info.annotation, *info.metadata])
    return st.from_type(info.annotation)


def from_factory(
    factory: type[ModelFactory], **overrides: st.SearchStrategy[Any]
) -> st.SearchStrategy[Any]:
    # Only the named fields are owned by Hypothesis; the factory fills the rest
    # (regex strings, HttpUrl, custom providers) so pydantic validation passes.
    return st.builds(factory.build, **overrides)

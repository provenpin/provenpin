import pytest
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableLambda
from chain import Flaky, build_chain, fake_model

INPUT = {"question": "hi"}

def test_happy_path_returns_text():
    chain = build_chain(fake_model("pong"), fake_model("backup"))
    assert chain.invoke(INPUT) == "pong"

def test_retry_recovers_before_fallback():
    primary = Flaky(fake_model("primary"), fail_times=2)
    chain = build_chain(RunnableLambda(primary), fake_model("backup"), attempts=3)
    assert chain.invoke(INPUT) == "primary"
    assert primary.calls == 3

def test_fallback_after_retries_exhausted():
    primary = Flaky(fake_model("primary"), fail_times=99)
    chain = build_chain(RunnableLambda(primary), fake_model("backup"), attempts=3)
    assert chain.invoke(INPUT) == "backup"
    assert primary.calls == 3

def test_fallback_receives_original_input_not_the_error():
    seen = []

    def capture(value):
        seen.append(value)
        return AIMessage(content="ok")

    primary = Flaky(fake_model("primary"), fail_times=99)
    chain = build_chain(RunnableLambda(primary), RunnableLambda(capture))
    assert chain.invoke(INPUT) == "ok"
    assert "hi" in seen[0].to_string()

def test_unlisted_exception_bypasses_retry_and_fallback():
    primary = Flaky(fake_model("primary"), fail_times=99, exc=ValueError)
    chain = build_chain(RunnableLambda(primary), fake_model("backup"))
    with pytest.raises(ValueError):
        chain.invoke(INPUT)
    assert primary.calls == 1

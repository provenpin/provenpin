from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.messages import AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are terse."),
    ("human", "{question}"),
])

def fake_model(text: str) -> GenericFakeChatModel:
    # The messages iterator is consumed on every call, so build a fresh model per use.
    return GenericFakeChatModel(messages=iter([AIMessage(content=text)]))

class Flaky:
    """Raises `exc` for the first `fail_times` calls, then delegates to `inner`."""

    def __init__(self, inner: Runnable, fail_times: int, exc: type[Exception] = TimeoutError):
        self.inner, self.fail_times, self.exc = inner, fail_times, exc
        self.calls = 0

    def __call__(self, value):
        self.calls += 1
        if self.calls <= self.fail_times:
            raise self.exc("transient")
        return self.inner.invoke(value)

def build_chain(primary: Runnable, backup: Runnable, attempts: int = 3):
    # Retry happens first, on the primary only. The fallback runs once retries are exhausted.
    retried = primary.with_retry(
        retry_if_exception_type=(TimeoutError,),
        stop_after_attempt=attempts,
        wait_exponential_jitter=False,
    )
    guarded = retried.with_fallbacks([backup], exceptions_to_handle=(TimeoutError,))
    return prompt | guarded | StrOutputParser()

import pytest
from langchain_core.exceptions import OutputParserException
from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.messages import AIMessage
from chain import Sentiment, build_chain, prompt

def fake(*replies):
    return GenericFakeChatModel(messages=iter([AIMessage(content=r) for r in replies]))

def test_parses_structured_output():
    out = build_chain(fake('{"label": "positive", "score": 0.9}')).invoke({"text": "love it"})
    assert out == Sentiment(label="positive", score=0.9)

def test_parses_fenced_json():
    out = build_chain(fake('```json\n{"label": "neutral", "score": 0.5}\n```')).invoke({"text": "ok"})
    assert out.label == "neutral"

def test_bad_output_raises():
    with pytest.raises(OutputParserException):
        build_chain(fake('{"label": "angry", "score": 3}')).invoke({"text": "grr"})

def test_prompt_includes_format_instructions():
    msgs = prompt.format_messages(text="hi")
    assert "score" in msgs[0].content and msgs[1].content == "hi"

def test_batch():
    outs = build_chain(fake('{"label":"positive","score":1}', '{"label":"negative","score":0.1}')).batch([{"text": "a"}, {"text": "b"}], config={"max_concurrency": 1})
    assert [o.label for o in outs] == ["positive", "negative"]

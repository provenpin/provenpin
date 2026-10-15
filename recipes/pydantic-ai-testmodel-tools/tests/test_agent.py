import pytest
from pydantic_ai.exceptions import UserError
from pydantic_ai.messages import ModelMessage, ModelResponse, ToolCallPart, ToolReturnPart
from pydantic_ai.models.function import AgentInfo, FunctionModel
from pydantic_ai.models.test import TestModel

from agent import Quote, agent


def scripted(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
    """Call lookup_price once, then return the typed final result built from its return value."""
    returns = [p.content for m in messages for p in m.parts if isinstance(p, ToolReturnPart)]
    if not returns:
        return ModelResponse(parts=[ToolCallPart("lookup_price", {"item": "widget"})])
    price = returns[-1]
    final = info.output_tools[0].name
    return ModelResponse(parts=[ToolCallPart(final, {"item": "widget", "qty": 3, "total_cents": 3 * price})])


def test_typed_output_from_tool_using_deps(deps):
    with agent.override(model=FunctionModel(scripted)):
        result = agent.run_sync("3 widgets please", deps=deps)
    assert result.output == Quote(item="widget", qty=3, total_cents=750)


def test_testmodel_output_without_calling_tools(deps):
    # TestModel calls every tool by default; call_tools=[] isolates the output path.
    model = TestModel(call_tools=[], custom_output_args={"item": "gadget", "qty": 1, "total_cents": 1000})
    with agent.override(model=model):
        result = agent.run_sync("one gadget", deps=deps)
    assert result.output.total_cents == 1000
    called = [p.tool_name for m in result.all_messages() for p in m.parts if isinstance(p, ToolCallPart)]
    assert "lookup_price" not in called


def test_unoverridden_agent_refuses_to_run(deps):
    with pytest.raises(UserError):
        agent.run_sync("hi", deps=deps)


def test_override_is_scoped_to_block(deps):
    model = TestModel(call_tools=[], custom_output_args={"item": "gadget", "qty": 1, "total_cents": 1000})
    with agent.override(model=model):
        agent.run_sync("one gadget", deps=deps)
    with pytest.raises(UserError):
        agent.run_sync("one gadget", deps=deps)

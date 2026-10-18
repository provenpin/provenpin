import pytest

from schema import Store, schema

@pytest.fixture
def store():
    s = Store()
    s.add("Ada Lovelace", "ada@example.com")
    return s

async def run(query, store, variables=None):
    return await schema.execute(query, variable_values=variables, context_value=store)

async def test_query_reads_context(store):
    result = await run('{ user(id: "1") { id name } }', store)
    assert result.errors is None
    assert result.data == {"user": {"id": "1", "name": "Ada Lovelace"}}

async def test_resolver_field_is_camel_cased(store):
    # the Python field is display_name but the schema exposes displayName
    result = await run('{ user(id: "1") { displayName } }', store)
    assert result.errors is None
    assert result.data["user"]["displayName"] == "Ada Lovelace"

async def test_mutation_with_variables(store):
    query = """
    mutation Create($input: CreateUserInput!) {
      createUser(input: $input) { id name email }
    }
    """
    result = await run(query, store, {"input": {"name": "Grace Hopper", "email": "grace@example.com"}})
    assert result.errors is None
    assert result.data["createUser"]["name"] == "Grace Hopper"
    assert len(store.users) == 2

async def test_missing_input_field_is_a_validation_error(store):
    result = await run('mutation { createUser(input: {name: "x"}) { id } }', store)
    assert result.data is None
    assert result.errors is not None
    assert "email" in str(result.errors)

async def test_async_resolver_needs_async_execute(store):
    result = await run("{ users { name } }", store)
    assert result.errors is None
    assert [u["name"] for u in result.data["users"]] == ["Ada Lovelace"]
    # execute_sync does not raise here, it returns an error result instead
    sync = schema.execute_sync("{ users { name } }", context_value=store)
    assert sync.data is None
    assert "synchronously" in str(sync.errors)

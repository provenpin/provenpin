import httpx
import pytest
from prometheus_client import CollectorRegistry, CONTENT_TYPE_LATEST
from prometheus_client.parser import text_string_to_metric_families

from app import create_app


def make_client(app):
    return httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app), base_url="http://test"
    )


def sample_value(text, name, **labels):
    for family in text_string_to_metric_families(text):
        for sample in family.samples:
            if sample.name == name and sample.labels == labels:
                return sample.value
    return None


async def test_scrape_returns_prometheus_text_format():
    app = create_app()
    async with make_client(app) as client:
        response = await client.get("/metrics")
    assert response.status_code == 200
    assert response.headers["content-type"] == CONTENT_TYPE_LATEST
    assert "# HELP http_requests" in response.text


async def test_counter_uses_route_template_not_raw_path():
    app = create_app()
    async with make_client(app) as client:
        await client.get("/items/1")
        await client.get("/items/2")
        text = (await client.get("/metrics")).text
    assert sample_value(
        text, "http_requests_total", method="GET", path="/items/{item_id}", status="200"
    ) == 2
    assert sample_value(
        text, "http_requests_total", method="GET", path="/items/1", status="200"
    ) is None


async def test_metrics_scrape_does_not_count_itself():
    app = create_app()
    async with make_client(app) as client:
        await client.get("/metrics")
        text = (await client.get("/metrics")).text
    assert sample_value(
        text, "http_requests_total", method="GET", path="/metrics", status="200"
    ) is None


async def test_unmatched_route_falls_back_to_raw_path():
    app = create_app()
    async with make_client(app) as client:
        await client.get("/nope")
        text = (await client.get("/metrics")).text
    assert sample_value(
        text, "http_requests_total", method="GET", path="/nope", status="404"
    ) == 1


def test_registry_rejects_duplicate_metric_names():
    registry = CollectorRegistry()
    create_app(registry)
    with pytest.raises(ValueError, match="Duplicated timeseries"):
        create_app(registry)


async def test_separate_apps_keep_separate_registries():
    first, second = create_app(), create_app()
    async with make_client(first) as client:
        await client.get("/items/1")
    async with make_client(second) as client:
        text = (await client.get("/metrics")).text
    assert sample_value(
        text, "http_requests_total", method="GET", path="/items/{item_id}", status="200"
    ) is None

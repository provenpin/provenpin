import httpx
from prometheus_client import CONTENT_TYPE_LATEST, CollectorRegistry
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


async def test_metrics_endpoint_serves_prometheus_text_format():
    app = create_app(CollectorRegistry())
    async with make_client(app) as client:
        await client.get("/items/1")
        response = await client.get("/metrics")
    assert response.status_code == 200
    assert response.headers["content-type"] == CONTENT_TYPE_LATEST
    assert "# HELP http_requests_total" in response.text


async def test_counter_labels_route_template_and_groups_status():
    app = create_app(CollectorRegistry())
    async with make_client(app) as client:
        await client.get("/items/1")
        await client.get("/items/2")
        await client.get("/boom")
        text = (await client.get("/metrics")).text
    assert sample_value(
        text,
        "http_requests_total",
        method="GET",
        status="2xx",
        handler="/items/{item_id}",
    ) == 2
    assert sample_value(
        text, "http_requests_total", method="GET", status="5xx", handler="/boom"
    ) == 1
    assert sample_value(
        text, "http_requests_total", method="GET", status="2xx", handler="/items/1"
    ) is None


async def test_unmatched_routes_collapse_to_none_handler():
    app = create_app(CollectorRegistry())
    async with make_client(app) as client:
        await client.get("/missing")
        text = (await client.get("/metrics")).text
    assert sample_value(
        text, "http_requests_total", method="GET", status="4xx", handler="none"
    ) == 1


async def test_scraping_metrics_counts_itself_unless_excluded():
    counting = create_app(CollectorRegistry())
    async with make_client(counting) as client:
        await client.get("/metrics")
        text = (await client.get("/metrics")).text
    assert sample_value(
        text, "http_requests_total", method="GET", status="2xx", handler="/metrics"
    ) == 1

    excluded = create_app(CollectorRegistry(), excluded_handlers=["/metrics"])
    async with make_client(excluded) as client:
        await client.get("/metrics")
        text = (await client.get("/metrics")).text
    assert sample_value(
        text, "http_requests_total", method="GET", status="2xx", handler="/metrics"
    ) is None


async def test_shared_registry_silently_disables_second_app():
    registry = CollectorRegistry()
    first, second = create_app(registry), create_app(registry)
    async with make_client(first) as client:
        await client.get("/items/1")
    async with make_client(second) as client:
        await client.get("/items/1")
        text = (await client.get("/metrics")).text
    assert sample_value(
        text, "http_requests_total", method="GET", status="2xx", handler="/items/{item_id}"
    ) == 1


async def test_latency_histograms_differ_in_labels_and_buckets():
    app = create_app(CollectorRegistry())
    async with make_client(app) as client:
        await client.get("/items/1")
        text = (await client.get("/metrics")).text
    assert sample_value(
        text,
        "http_request_duration_seconds_count",
        method="GET",
        handler="/items/{item_id}",
    ) == 1
    assert sample_value(text, "http_request_duration_highr_seconds_count") == 1
    assert sample_value(
        text,
        "http_request_duration_seconds_bucket",
        method="GET",
        handler="/items/{item_id}",
        le="+Inf",
    ) == 1

from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter


def make_tracer(service_name: str = "recipe"):
    # Fresh provider + exporter per call, so tests never touch the global provider.
    exporter = InMemorySpanExporter()
    provider = TracerProvider()
    provider.add_span_processor(SimpleSpanProcessor(exporter))
    return provider.get_tracer(service_name), exporter

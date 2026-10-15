from opentelemetry.trace import Link

from spans import make_tracer


def by_name(exporter):
    return {span.name: span for span in exporter.get_finished_spans()}


def test_span_exported_with_attributes():
    tracer, exporter = make_tracer()
    with tracer.start_as_current_span("work") as span:
        span.set_attribute("http.method", "GET")
    spans = by_name(exporter)
    assert spans["work"].attributes["http.method"] == "GET"


def test_unfinished_span_is_not_exported():
    tracer, exporter = make_tracer()
    span = tracer.start_span("pending")
    assert exporter.get_finished_spans() == ()
    span.end()
    assert len(exporter.get_finished_spans()) == 1


def test_nested_spans_share_trace_id():
    tracer, exporter = make_tracer()
    with tracer.start_as_current_span("parent"):
        with tracer.start_as_current_span("child"):
            pass
    spans = by_name(exporter)
    assert spans["child"].context.trace_id == spans["parent"].context.trace_id
    assert spans["child"].parent.span_id == spans["parent"].context.span_id


def test_set_attribute_after_end_is_ignored():
    tracer, exporter = make_tracer()
    span = tracer.start_span("done")
    span.end()
    span.set_attribute("late", True)
    spans = by_name(exporter)
    assert "late" not in spans["done"].attributes


def test_links_are_recorded_without_parenting():
    tracer, exporter = make_tracer()
    with tracer.start_as_current_span("root") as root:
        pass
    root_ctx = root.get_span_context()
    with tracer.start_as_current_span("linked", links=[Link(root_ctx)]):
        pass
    spans = by_name(exporter)
    assert spans["linked"].parent is None
    assert spans["linked"].links[0].context.span_id == root_ctx.span_id

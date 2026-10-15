import networkx as nx
import pytest

from graph import build_dag, build_order, detect_cycle, fastest_route


def test_build_order_respects_dependencies():
    g = build_dag([("a", "b", 1), ("b", "c", 1), ("a", "c", 1)])
    assert build_order(g) == ["a", "b", "c"]


def test_cycle_raises_before_returning_order():
    g = build_dag([("a", "b", 1), ("b", "c", 1), ("c", "a", 1)])
    with pytest.raises(ValueError, match="dependency cycle"):
        build_order(g)


def test_detect_cycle_wraps_no_cycle_exception():
    cyclic = build_dag([("a", "b", 1), ("b", "c", 1), ("c", "a", 1)])
    assert detect_cycle(cyclic) is not None
    assert detect_cycle(build_dag([("a", "b", 1)])) is None


def test_self_loop_counts_as_cycle():
    g = build_dag([("a", "a", 1)])
    assert not nx.is_directed_acyclic_graph(g)
    assert detect_cycle(g) == [("a", "a")]


def test_shortest_path_ignores_weight_unless_asked():
    g = build_dag([("a", "d", 100), ("a", "b", 1), ("b", "d", 1)])
    assert nx.shortest_path(g, "a", "d") == ["a", "d"]
    assert nx.shortest_path(g, "a", "d", weight="weight") == ["a", "b", "d"]


def test_unreachable_target_raises_no_path():
    g = build_dag([("a", "b", 1), ("c", "d", 1)])
    with pytest.raises(nx.NetworkXNoPath):
        fastest_route(g, "a", "d")

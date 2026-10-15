import networkx as nx


def build_dag(edges):
    """edges: iterable of (src, dst, weight)."""
    g = nx.DiGraph()
    g.add_weighted_edges_from(edges)
    return g


def build_order(g):
    # topological_sort silently returns garbage order on a cycle, so guard first
    if not nx.is_directed_acyclic_graph(g):
        raise ValueError(f"dependency cycle: {nx.find_cycle(g)}")
    return list(nx.topological_sort(g))


def detect_cycle(g):
    # find_cycle raises NetworkXNoCycle when the graph is a DAG
    try:
        return nx.find_cycle(g)
    except nx.NetworkXNoCycle:
        return None


def fastest_route(g, source, target):
    # without weight= this is hop-count BFS, not Dijkstra
    return nx.shortest_path(g, source, target, weight="weight")

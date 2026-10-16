from simpleeval import DEFAULT_FUNCTIONS, EvalWithCompoundTypes

SAFE_ATTRS = {
    str: {"lower", "upper", "strip", "title"},
    int: {"bit_length"},
    float: {"is_integer"},
    list: {"count", "index"},
}


def evaluate(formula, values=None, functions=None, allowed_attrs=SAFE_ATTRS):
    fns = dict(DEFAULT_FUNCTIONS)
    fns["clamp"] = lambda x, lo, hi: max(lo, min(hi, x))
    fns["total"] = lambda items: sum(items)
    if functions:
        fns.update(functions)

    evaluator = EvalWithCompoundTypes(
        names=dict(values or {}),
        functions=fns,
        allowed_attrs=allowed_attrs,
    )
    return evaluator.eval(formula)

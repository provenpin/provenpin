import operator

from parsimonious.grammar import Grammar
from parsimonious.nodes import NodeVisitor

GRAMMAR = Grammar(
    r"""
    expr   = term (add_op term)*
    term   = factor (mul_op factor)*
    factor = number / paren
    paren  = "(" expr ")"
    add_op = "+" / "-"
    mul_op = "*" / "/"
    number = ~r"\d+"
    """
)

OPS = {"+": operator.add, "-": operator.sub, "*": operator.mul, "/": operator.truediv}


class Calc(NodeVisitor):
    grammar = GRAMMAR

    def generic_visit(self, node, children):
        # Literals and wrapper nodes just pass their children through.
        return children or node

    def visit_expr(self, node, children):
        value, rest = children
        for op, term in rest:
            value = op(value, term)
        return value

    def visit_term(self, node, children):
        value, rest = children
        for op, factor in rest:
            value = op(value, factor)
        return value

    def visit_factor(self, node, children):
        return children[0]

    def visit_paren(self, node, children):
        return children[1]

    def visit_add_op(self, node, children):
        return OPS[node.text]

    def visit_mul_op(self, node, children):
        return OPS[node.text]

    def visit_number(self, node, children):
        return int(node.text)


def evaluate(text):
    return Calc().parse(text)

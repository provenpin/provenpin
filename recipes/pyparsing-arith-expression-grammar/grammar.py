import operator

from pyparsing import (
    OpAssoc,
    ParserElement,
    Word,
    alphanums,
    alphas,
    infix_notation,
    one_of,
)

ParserElement.enable_packrat()

_BINARY = {
    "+": operator.add,
    "-": operator.sub,
    "*": operator.mul,
    "/": operator.truediv,
    "^": operator.pow,
}


def _fold_binary(tokens):
    terms = tokens[0]
    value = terms[0]
    for op, rhs in zip(terms[1::2], terms[2::2]):
        value = _BINARY[op](value, rhs)
    return value


def _fold_unary(tokens):
    terms = tokens[0]
    value = terms[-1]
    for _ in terms[:-1]:
        value = -value
    return value


def _resolve(variables):
    def lookup(tokens):
        name = tokens[0]
        if name not in variables:
            raise ValueError(f"undefined variable: {name}")
        return variables[name]

    return lookup


def build_parser(variables=None):
    variables = variables or {}
    number = Word("0123456789").set_parse_action(lambda t: float(t[0]))
    variable = Word(alphas + "_", alphanums + "_").set_parse_action(_resolve(variables))
    operand = number | variable
    return infix_notation(
        operand,
        [
            (one_of("+ -"), 1, OpAssoc.RIGHT, _fold_unary),
            (one_of("^"), 2, OpAssoc.RIGHT, _fold_binary),
            (one_of("* /"), 2, OpAssoc.LEFT, _fold_binary),
            (one_of("+ -"), 2, OpAssoc.LEFT, _fold_binary),
        ],
    )


def evaluate(expression, **variables):
    return build_parser(variables).parse_string(expression, parse_all=True)[0]

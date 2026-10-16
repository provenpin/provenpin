from lark import Lark, Transformer

GRAMMAR = r"""
?start: sum

?sum: product
    | sum "+" product -> add
    | sum "-" product -> sub

?product: atom
    | product "*" atom -> mul
    | product "/" atom -> div

?atom: NUMBER -> number
     | "-" atom   -> neg
     | "(" sum ")"

%import common.NUMBER
%import common.WS_INLINE
%ignore WS_INLINE
"""

def parse(text):
    return Lark(GRAMMAR, parser="lalr").parse(text)

class Calc(Transformer):
    def number(self, items):
        return float(items[0])

    def add(self, items):
        return items[0] + items[1]

    def sub(self, items):
        return items[0] - items[1]

    def mul(self, items):
        return items[0] * items[1]

    def div(self, items):
        return items[0] / items[1]

    def neg(self, items):
        return -items[0]

def evaluate(text):
    return Calc().transform(parse(text))

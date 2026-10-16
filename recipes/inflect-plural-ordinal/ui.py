import inflect

p = inflect.engine()

def count_label(noun, count):
    # plural_noun returns the singular for count == 1, plural otherwise (0 included)
    return f"{count} {p.plural_noun(noun, count)}"

def ordinal(n):
    return p.ordinal(n)

def ordinal_words(n):
    # inflect 7.x number_to_words has no to="ordinal"; wrap the ordinal form instead
    return p.number_to_words(p.ordinal(n))

def with_article(noun):
    # a/an is chosen from the leading sound, not the leading letter
    return p.a(noun)

def spell_number(n, andword="and"):
    return p.number_to_words(n, andword=andword)

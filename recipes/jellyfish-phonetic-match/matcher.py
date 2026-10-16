import unicodedata

import jellyfish


def normalize(name):
    # NFKD + ascii drop makes matching accent and case insensitive
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return " ".join(ascii_name.upper().split())


def soundex_key(name):
    # soundex is a fixed 4-char code, so unrelated surnames often collide
    return jellyfish.soundex(normalize(name))


def metaphone_key(name):
    # metaphone is variable length and collapses non-letters to an empty string
    return jellyfish.metaphone(normalize(name))


def similarity(a, b):
    return jellyfish.jaro_winkler_similarity(normalize(a), normalize(b))


def is_match(a, b, threshold=0.9):
    na, nb = normalize(a), normalize(b)
    if not na or not nb:
        return False
    if na == nb:
        return True
    ma, mb = metaphone_key(na), metaphone_key(nb)
    if ma and ma == mb:
        return True
    return similarity(na, nb) >= threshold


def best_match(query, candidates):
    scored = ((c, similarity(query, c)) for c in candidates)
    choice, score = max(scored, key=lambda pair: pair[1], default=(None, 0.0))
    return {"choice": choice, "score": score}

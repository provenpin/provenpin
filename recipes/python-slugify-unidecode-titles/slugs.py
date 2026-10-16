from slugify import slugify

PAIR_REPLACEMENTS = [("C++", "cpp"), ("&", "and")]


def ascii_slug(title: str, max_length: int = 0, word_boundary: bool = False) -> str:
    # allow_unicode defaults to False, so text-unidecode transliterates to ASCII
    return slugify(
        title,
        max_length=max_length,
        word_boundary=word_boundary,
        replacements=PAIR_REPLACEMENTS,
    )


def unicode_slug(title: str, lowercase: bool = True) -> str:
    # keep CJK and other scripts verbatim instead of romanizing them
    return slugify(title, allow_unicode=True, lowercase=lowercase)


def unique_slug(title: str, taken: set[str]) -> str:
    base = ascii_slug(title) or "untitled"
    if base not in taken:
        return base
    suffix = 2
    while f"{base}-{suffix}" in taken:
        suffix += 1
    return f"{base}-{suffix}"

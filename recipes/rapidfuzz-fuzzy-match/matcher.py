from rapidfuzz import fuzz, process, utils


def best_match(query, choices, cutoff=70):
    match = process.extractOne(query, choices, scorer=fuzz.WRatio, score_cutoff=cutoff)
    if match is None:
        return None
    choice, score, index = match
    return {"choice": choice, "score": score, "index": index}


def match_normalized(query, choices, cutoff=70):
    return process.extractOne(
        query,
        choices,
        scorer=fuzz.WRatio,
        processor=utils.default_process,
        score_cutoff=cutoff,
    )


def match_reordered(query, choices):
    return process.extractOne(query, choices, scorer=fuzz.token_sort_ratio)


def closest(query, choices, limit=2):
    return process.extract(query, choices, scorer=fuzz.WRatio, score_cutoff=0, limit=limit)

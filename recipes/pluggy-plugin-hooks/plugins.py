from hookspecs import hookimpl


class Enricher:
    def __init__(self, tag: str):
        self.tag = tag

    @hookimpl
    def enrich(self, record: dict) -> None:
        record.setdefault("order", []).append(self.tag)


class FirstEnricher:
    @hookimpl(tryfirst=True)
    def enrich(self, record: dict) -> None:
        record.setdefault("order", []).append("first")


class LastEnricher:
    @hookimpl(trylast=True)
    def enrich(self, record: dict) -> None:
        record.setdefault("order", []).append("last")


class PriorityScorer:
    @hookimpl(tryfirst=True)
    def score(self, record: dict) -> int | None:
        return record.get("priority")


class FallbackScorer:
    @hookimpl(trylast=True)
    def score(self, record: dict) -> int | None:
        return 1


class ScoreClamp:
    @hookimpl(wrapper=True)
    def score(self, record: dict):
        raw = yield
        return min(raw or 0, 50)


class Outer:
    def __init__(self, log: list):
        self.log = log

    @hookimpl(wrapper=True, tryfirst=True)
    def audit(self, event: str, payload: dict):
        self.log.append("outer-before")
        try:
            return (yield)
        finally:
            self.log.append("outer-after")


class Inner:
    def __init__(self, log: list):
        self.log = log

    @hookimpl(wrapper=True, trylast=True)
    def audit(self, event: str, payload: dict):
        self.log.append("inner-before")
        try:
            return (yield)
        finally:
            self.log.append("inner-after")


class AuditLog:
    def __init__(self, log: list):
        self.log = log

    @hookimpl
    def audit(self, event: str, payload: dict) -> None:
        self.log.append(f"impl:{event}")

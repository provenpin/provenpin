import pluggy

project_name = "provenpin"
hookspec = pluggy.HookspecMarker(project_name)
hookimpl = pluggy.HookimplMarker(project_name)


class ProcessorSpec:
    @hookspec
    def enrich(self, record: dict) -> None:
        """Mutate the record in place. Every plugin gets a chance to run."""

    @hookspec(firstresult=True)
    def score(self, record: dict) -> int | None:
        """Return the first non-None score, or None when no plugin scores it."""

    @hookspec
    def audit(self, event: str, payload: dict) -> None:
        """Side-effect hook. All plugins and wrappers are called."""

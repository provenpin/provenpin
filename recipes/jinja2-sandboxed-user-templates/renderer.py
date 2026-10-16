from jinja2 import StrictUndefined, TemplateError
from jinja2.sandbox import ImmutableSandboxedEnvironment, safe_range


class OutputTooLargeError(TemplateError):
    """Raised when a rendered template exceeds the configured size cap."""


class SafeRenderer:
    """Render untrusted user templates with a locked-down Jinja2 sandbox."""

    def __init__(self, allowed_globals=None, max_output=100_000):
        # Immutable sandbox blocks in-place mutation of list/dict/set passed in.
        self.env = ImmutableSandboxedEnvironment(
            undefined=StrictUndefined,
            autoescape=True,
        )
        # Drop Jinja's default globals (lipsum, cycler, dict, ...): allowlist only.
        self.env.globals = {"range": safe_range}
        self.env.globals.update(allowed_globals or {})
        self.max_output = max_output

    def render(self, source, context=None):
        template = self.env.from_string(source)
        parts = []
        size = 0
        # generate() is lazy, so the cap stops a runaway loop mid-render.
        for chunk in template.generate(**(context or {})):
            size += len(chunk)
            if size > self.max_output:
                raise OutputTooLargeError(
                    f"rendered output exceeded {self.max_output} characters"
                )
            parts.append(chunk)
        return "".join(parts)

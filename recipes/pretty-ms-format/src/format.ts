import prettyMilliseconds from "pretty-ms";

export type DurationStyle = "default" | "compact" | "verbose" | "clock";

export function formatDuration(
  milliseconds: number,
  style: DurationStyle = "default",
): string {
  switch (style) {
    case "compact":
      return prettyMilliseconds(milliseconds, { compact: true });
    case "verbose":
      return prettyMilliseconds(milliseconds, { verbose: true });
    case "clock":
      return prettyMilliseconds(milliseconds, { colonNotation: true });
    default:
      return prettyMilliseconds(milliseconds);
  }
}

export function formatPrecise(milliseconds: number): string {
  return prettyMilliseconds(milliseconds, {
    separateMilliseconds: true,
    secondsDecimalDigits: 0,
    millisecondsDecimalDigits: 2,
  });
}

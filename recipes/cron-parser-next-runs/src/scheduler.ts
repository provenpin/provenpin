import { CronExpressionParser } from "cron-parser";

export type RunOptions = {
  currentDate: Date;
  tz?: string;
};

function interval(expression: string, options: RunOptions) {
  return CronExpressionParser.parse(expression, {
    currentDate: options.currentDate,
    tz: options.tz,
  });
}

export function nextRun(expression: string, options: RunOptions): Date {
  return interval(expression, options).next().toDate();
}

export function previousRun(expression: string, options: RunOptions): Date {
  return interval(expression, options).prev().toDate();
}

export function nextRuns(expression: string, count: number, options: RunOptions): Date[] {
  return interval(expression, options)
    .take(count)
    .map((date) => date.toDate());
}

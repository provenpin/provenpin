import { Observable, of, timer } from "rxjs";
import { catchError, debounceTime, distinctUntilChanged, filter, map, retry, switchMap } from "rxjs/operators";

export type SearchFn = (q: string) => Observable<string[]>;

/** Classic typeahead: wait for a pause, skip repeats and short terms, cancel stale requests. */
export function typeahead(input$: Observable<string>, search: SearchFn, dueTime = 30): Observable<string[]> {
  return input$.pipe(
    map((q) => q.trim()),
    debounceTime(dueTime),
    filter((q) => q.length >= 2),
    distinctUntilChanged(),
    switchMap((q) => search(q).pipe(catchError(() => of(["error"])))),
  );
}

/** Retry a failing source with a fixed delay between attempts. */
export function withRetry<T>(source$: Observable<T>, count: number, delayMs: number): Observable<T> {
  return source$.pipe(retry({ count, delay: () => timer(delayMs) }));
}

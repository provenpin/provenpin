import { test } from "node:test";
import assert from "node:assert/strict";
import { TestScheduler } from "rxjs/testing";
import { typeahead, withRetry } from "../src/search.ts";

const scheduler = () => new TestScheduler((actual, expected) => assert.deepEqual(actual, expected));

test("debounces, filters short terms and dedupes", () => {
  scheduler().run(({ hot, cold, expectObservable }) => {
    const input = hot("a 10ms b 40ms c 40ms d", { a: "r", b: "rx", c: "rx ", d: "rxjs" });
    const search = (q: string) => cold("-r|", { r: [q.toUpperCase()] });
    // Frames: a=0, b=11, c=52, d=93. "rx" settles at 41 and the search answers at 42;
    // "rx " trims to a duplicate; "rxjs" settles at 123 and answers at 124.
    expectObservable(typeahead(input, search)).toBe("42ms x 81ms y", { x: ["RX"], y: ["RXJS"] });
  });
});

test("switchMap cancels a slow in-flight search", () => {
  scheduler().run(({ hot, cold, expectObservable, expectSubscriptions }) => {
    const input = hot("a 40ms b", { a: "ab", b: "abc" });
    const slow = cold("50ms r|", { r: ["slow"] });
    const fast = cold("1ms r|", { r: ["fast"] });
    const search = (q: string) => (q === "ab" ? slow : fast);
    expectObservable(typeahead(input, search)).toBe("72ms x", { x: ["fast"] });
    // slow is subscribed when "ab" settles (30) and dropped when "abc" settles (71).
    expectSubscriptions(slow.subscriptions).toBe("30ms ^ 40ms !");
  });
});

test("errors become a fallback value without killing the stream", () => {
  scheduler().run(({ hot, cold, expectObservable }) => {
    const input = hot("a 40ms b", { a: "bad", b: "good" });
    const search = (q: string) => (q === "bad" ? cold("#") : cold("r|", { r: [q] }));
    expectObservable(typeahead(input, search)).toBe("30ms e 40ms g", { e: ["error"], g: ["good"] });
  });
});

test("retry resubscribes after a delay", () => {
  scheduler().run(({ cold, expectObservable, expectSubscriptions }) => {
    const source = cold("-#");
    expectObservable(withRetry(source, 2, 5)).toBe("13ms #");
    expectSubscriptions(source.subscriptions).toBe(["^!", "6ms ^!", "12ms ^!"]);
  });
});

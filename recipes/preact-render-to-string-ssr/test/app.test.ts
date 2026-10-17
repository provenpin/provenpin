import { test } from "node:test";
import assert from "node:assert/strict";
import { h } from "preact";
import { renderToString } from "preact-render-to-string";
import {
  Banner,
  Counter,
  Greeting,
  renderPage,
  UserList,
  type User,
} from "../src/app.ts";

test("renders a component with props", () => {
  assert.equal(renderToString(h(Greeting, { name: "Ada" })), "<h1>Hello, Ada!</h1>");
});

test("renders useState initial value", () => {
  assert.equal(
    renderToString(h(Counter, { start: 5 })),
    '<p class="count">Count: 5</p>',
  );
  assert.equal(renderToString(h(Counter, {})), '<p class="count">Count: 0</p>');
});

test("escapes text content", () => {
  assert.equal(
    renderToString(h(Greeting, { name: "A & B and 1 < 2" })),
    "<h1>Hello, A &amp; B and 1 &lt; 2!</h1>",
  );
});

test("renders keyed lists", () => {
  const users: User[] = [
    { id: "1", name: "Ada" },
    { id: "2", name: "Bob" },
  ];
  assert.equal(renderToString(h(UserList, { users })), "<ul><li>Ada</li><li>Bob</li></ul>");
  assert.equal(renderToString(h(UserList, { users: [] })), "<ul></ul>");
});

test("renders dangerouslySetInnerHTML without escaping", () => {
  assert.equal(
    renderToString(h(Banner, { html: "<em>hi</em> & <b>bye</b>" })),
    '<div class="banner"><em>hi</em> & <b>bye</b></div>',
  );
});

test("renders conditional branches", () => {
  assert.equal(
    renderPage(null, []),
    '<main><p>Please sign in</p><div class="banner"><strong>Welcome</strong></div><ul></ul></main>',
  );
  assert.equal(
    renderPage(
      { id: "1", name: "Ada" },
      [
        { id: "1", name: "Ada" },
        { id: "2", name: "Bob" },
      ],
    ),
    '<main><h1>Hello, Ada!</h1><div class="banner"><strong>Welcome</strong></div><ul><li>Ada</li><li>Bob</li></ul></main>',
  );
});

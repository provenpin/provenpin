import { h, type FunctionComponent } from "preact";
import { useState } from "preact/hooks";
import { renderToString } from "preact-render-to-string";

export type User = {
  id: string;
  name: string;
};

export const Greeting: FunctionComponent<{ name: string }> = ({ name }) =>
  h("h1", null, `Hello, ${name}!`);

export const Counter: FunctionComponent<{ start?: number }> = ({ start = 0 }) => {
  const [count] = useState(start);
  return h("p", { class: "count" }, `Count: ${count}`);
};

export const UserList: FunctionComponent<{ users: User[] }> = ({ users }) =>
  h(
    "ul",
    null,
    users.map((user) => h("li", { key: user.id }, user.name)),
  );

export const Banner: FunctionComponent<{ html: string }> = ({ html }) =>
  h("div", { class: "banner", dangerouslySetInnerHTML: { __html: html } });

export const Page: FunctionComponent<{ user: User | null; users: User[] }> = ({
  user,
  users,
}) =>
  h(
    "main",
    null,
    user ? h(Greeting, { name: user.name }) : h("p", null, "Please sign in"),
    h(Banner, { html: "<strong>Welcome</strong>" }),
    h(UserList, { users }),
  );

export function renderPage(user: User | null, users: User[]): string {
  return renderToString(h(Page, { user, users }));
}

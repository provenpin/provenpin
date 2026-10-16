import pug from "pug";

export type InboxItem = {
  from: string;
  subject: string;
  unread?: boolean;
};

export type InboxLocals = {
  title: string;
  items: InboxItem[];
};

const inboxTemplate = `mixin row(item)
  li(class=item.unread ? "unread" : "read")
    strong= item.from
    span.subject= item.subject

h1= title
if items.length
  ul.inbox
    each item in items
      +row(item)
else
  p.empty No messages`;

export function renderInbox(locals: InboxLocals): string {
  return pug.compile(inboxTemplate, { filename: "inbox.pug" })(locals);
}

export function renderComment(html: string, escape: boolean): string {
  const source = escape ? "p= html" : "p!= html";
  return pug.compile(source)({ html });
}

export function renderFile(path: string, locals: Record<string, unknown>): string {
  return pug.compileFile(path)(locals);
}

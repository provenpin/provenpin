import Handlebars from "handlebars";

export type InvoiceItem = { name: string; qty: number; price: number };

Handlebars.registerHelper("money", (n: number) => `$${(Number(n) || 0).toFixed(2)}`);
Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);

const layout = Handlebars.compile(`<!doctype html>
<html><body>
{{> header}}
<main>{{{body}}}</main>
</body></html>`);

Handlebars.registerPartial("header", "<header><h1>{{brand}}</h1></header>");

const invoiceBody = Handlebars.compile(`
<p>Hello {{name}},</p>
{{#if premium}}<p>Thanks for being premium.</p>{{/if}}
<ul>
{{#each items}}
  <li>{{name}} x{{qty}} - {{money price}}</li>
{{/each}}
</ul>
<p>Total: {{money total}}</p>
`);

export function renderInvoice(data: {
  brand: string;
  name: string;
  premium: boolean;
  items: InvoiceItem[];
}) {
  const total = data.items.reduce((s, i) => s + i.qty * i.price, 0);
  const body = invoiceBody({ ...data, total });
  return layout({ brand: data.brand, body });
}

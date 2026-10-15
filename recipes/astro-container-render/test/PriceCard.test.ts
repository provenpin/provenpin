import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import PriceCard from "../src/components/PriceCard.astro";

describe("PriceCard", () => {
  it("renders props and slot", async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(PriceCard, { props: { name: "Pro", price: 9 }, slots: { default: "<li>Unlimited recipes</li>" } });
    expect(html).toContain("Pro</h2>");
    expect(html).toContain("$9/mo");
    expect(html).toContain("Unlimited recipes");
    expect(html).not.toContain("Most popular");
  });

  it("featured + free variants", async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(PriceCard, { props: { name: "Free", price: 0, featured: true } });
    expect(html).toMatch(/Free<\/p>/);
    expect(html).toMatch(/class="card featured/);
    expect(html).toContain("Most popular");
  });
});

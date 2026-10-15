import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { ProductFilter, UserCard } from "../src/Search.tsx";

// Auto-cleanup needs vitest globals; without them, unmount explicitly between tests.
afterEach(cleanup);

const products = [
  { id: 1, name: "Hard Hat", category: "head" },
  { id: 2, name: "Ear Muffs", category: "head" },
  { id: 3, name: "Steel Toe Boots", category: "feet" },
];

describe("ProductFilter", () => {
  it("filters by text and category through signals and memos", async () => {
    const user = userEvent.setup();
    render(() => <ProductFilter products={products} />);
    expect(screen.getByTestId("count").textContent).toBe("3 shown");
    await user.type(screen.getByLabelText("search"), "hat");
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Hard Hat"]);
    await user.clear(screen.getByLabelText("search"));
    await user.selectOptions(screen.getByLabelText("category"), "head");
    expect(screen.getByTestId("count").textContent).toBe("2 shown");
  });

  it("derives the category options and shows a fallback when nothing matches", async () => {
    const user = userEvent.setup();
    render(() => <ProductFilter products={products} />);
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["all", "head", "feet"]);
    await user.type(screen.getByLabelText("search"), "gloves");
    expect(screen.getByText("No matches")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });
});

describe("UserCard", () => {
  it("suspends while loading and refetches when the source signal changes", async () => {
    const user = userEvent.setup();
    const calls: number[] = [];
    const fetchUser = async (id: number) => { calls.push(id); await new Promise((r) => setTimeout(r, 5)); return { name: id === 1 ? "Ada" : "Grace" }; };
    render(() => <UserCard fetchUser={fetchUser} />);
    expect(screen.getByText("Loading")).toBeTruthy();
    expect(await screen.findByRole("heading", { name: "Ada" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Next user" }));
    expect(await screen.findByRole("heading", { name: "Grace" })).toBeTruthy();
    expect(calls).toEqual([1, 2]);
  });
});

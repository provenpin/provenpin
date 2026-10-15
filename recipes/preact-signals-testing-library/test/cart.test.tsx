/** @jsxImportSource preact */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { createCart, CartBadge, CartView, CouponForm } from "../src/cart.tsx";

afterEach(cleanup);

describe("signals store", () => {
  it("merges quantities and computes totals", () => {
    const cart = createCart();
    cart.add({ sku: "A", name: "Hat", priceCents: 1250 });
    cart.add({ sku: "A", name: "Hat", priceCents: 1250 });
    cart.add({ sku: "B", name: "Gloves", priceCents: 899 });
    expect(cart.count.value).toBe(3);
    expect(cart.totalCents.value).toBe(3399);
  });
});

describe("components", () => {
  it("badge re-renders when the signal changes, with no props change", async () => {
    const cart = createCart();
    render(<CartBadge cart={cart} />);
    expect(screen.getByLabelText("cart count").textContent).toBe("0");
    cart.add({ sku: "A", name: "Hat", priceCents: 1250 });
    expect(await screen.findByText("1")).toBeTruthy();
  });

  it("cart view lists items, totals and removes on click", async () => {
    const user = userEvent.setup();
    const cart = createCart();
    cart.add({ sku: "A", name: "Hat", priceCents: 1250 });
    cart.add({ sku: "B", name: "Gloves", priceCents: 899 });
    render(<CartView cart={cart} />);
    expect(screen.getByTestId("total").textContent).toBe("$21.49");
    await user.click(screen.getByRole("button", { name: "remove Hat" }));
    expect(screen.queryByText(/Hat/)).toBeNull();
    expect(screen.getByTestId("total").textContent).toBe("$8.99");
    await user.click(screen.getByRole("button", { name: "remove Gloves" }));
    expect(screen.getByText("Your cart is empty")).toBeTruthy();
  });

  it("coupon form normalises input, disables while checking, and shows the result", async () => {
    const user = userEvent.setup();
    let resolve!: (ok: boolean) => void;
    const onApply = vi.fn(() => new Promise<boolean>((r) => { resolve = r; }));
    render(<CouponForm onApply={onApply} />);
    const button = screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await user.type(screen.getByLabelText("Coupon"), "  save10 ");
    await user.click(button);
    expect(onApply).toHaveBeenCalledWith("SAVE10");
    expect(button.disabled).toBe(true);
    resolve(false);
    expect((await screen.findByRole("alert")).textContent).toBe("Invalid coupon");
  });
});

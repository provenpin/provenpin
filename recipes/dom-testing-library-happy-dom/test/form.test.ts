import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { mountSignup } from "../src/form";

let onSubmit: ReturnType<typeof vi.fn>;
beforeEach(() => { document.body.innerHTML = ""; onSubmit = vi.fn(); mountSignup(document.body, onSubmit); });

describe("signup form", () => {
  it("button enables once the user types", async () => {
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: "Create account" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await user.type(screen.getByLabelText("Email"), "a");
    expect(button.disabled).toBe(false);
  });

  it("shows an accessible error for invalid email", async () => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "nope");
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("alert").textContent).toBe("Enter a valid email");
    expect(screen.getByLabelText("Email").getAttribute("aria-invalid")).toBe("true");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid data with Enter", async () => {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "ada@example.com{Enter}");
    expect(onSubmit).toHaveBeenCalledWith({ email: "ada@example.com" });
  });
});

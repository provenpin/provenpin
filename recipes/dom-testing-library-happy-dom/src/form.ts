export function mountSignup(root: HTMLElement, onSubmit: (data: { email: string }) => void) {
  root.innerHTML = `
    <form novalidate aria-label="Sign up">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" aria-describedby="email-error" />
      <p id="email-error" role="alert" hidden></p>
      <button type="submit" disabled>Create account</button>
    </form>`;
  const form = root.querySelector("form")!;
  const input = root.querySelector<HTMLInputElement>("#email")!;
  const error = root.querySelector<HTMLParagraphElement>("#email-error")!;
  const button = root.querySelector("button")!;
  input.addEventListener("input", () => { button.disabled = input.value.trim() === ""; });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value);
    error.hidden = ok;
    error.textContent = ok ? "" : "Enter a valid email";
    input.setAttribute("aria-invalid", String(!ok));
    if (ok) onSubmit({ email: input.value.trim() });
  });
}

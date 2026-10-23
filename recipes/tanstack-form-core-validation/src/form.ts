import { FormApi } from "@tanstack/form-core";

export type Signup = { email: string; age: number };

export function createSignupForm(onValid: (v: Signup) => void) {
  const defaultValues: Signup = { email: "", age: 0 };
  const form = new FormApi({
    defaultValues,
    onSubmit: async ({ value }) => {
      onValid(value);
    },
  });
  form.mount();
  return form;
}

export function emailError(email: string) {
  if (!email.includes("@")) return "email must include @";
  return undefined;
}

export function ageError(age: number) {
  if (age < 18) return "must be 18+";
  return undefined;
}

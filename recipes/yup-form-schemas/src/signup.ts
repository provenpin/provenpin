import * as yup from "yup";

export const signupSchema = yup.object({
  email: yup.string().trim().lowercase().email("invalid email").required("email is required"),
  password: yup.string().min(8, "password must be at least 8 characters").required(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "passwords must match")
    .required(),
  accountType: yup.string().oneOf(["personal", "business"] as const).default("personal"),
  company: yup.string().when("accountType", {
    is: "business",
    then: (s) => s.required("company is required for business accounts"),
    otherwise: (s) => s.strip(),
  }),
  age: yup.number().transform((v, orig) => (orig === "" ? undefined : v)).integer().min(16).optional(),
  tags: yup.array(yup.string().required()).max(3).default([]),
});

export type Signup = yup.InferType<typeof signupSchema>;

export type FieldErrors = Record<string, string[]>;

export async function validateSignup(input: unknown): Promise<{ ok: true; value: Signup } | { ok: false; errors: FieldErrors }> {
  try {
    const value = await signupSchema.validate(input, { abortEarly: false, stripUnknown: true });
    return { ok: true, value };
  } catch (err) {
    if (!(err instanceof yup.ValidationError)) throw err;
    const errors: FieldErrors = {};
    for (const e of err.inner) {
      const key = e.path ?? "_";
      (errors[key] ??= []).push(e.message);
    }
    return { ok: false, errors };
  }
}

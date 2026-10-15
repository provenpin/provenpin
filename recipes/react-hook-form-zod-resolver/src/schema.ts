import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export const SignupSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  confirm: z.string(),
  age: z.coerce.number().int().min(18, "Must be 18+"), // inputs give strings; coerce to number
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

export type SignupInput = z.input<typeof SignupSchema>;
export type SignupValues = z.output<typeof SignupSchema>;

// In a component: useForm<SignupInput, unknown, SignupValues>({ resolver: signupResolver })
export const signupResolver = zodResolver(SignupSchema);

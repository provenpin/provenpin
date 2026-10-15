import validator from "validator";

// validator is CommonJS: use the default export, named ESM imports fail at runtime.
const {
  escape,
  isEmail,
  isStrongPassword,
  isURL,
  isUUID,
  normalizeEmail,
  trim,
} = validator;

export type RawInput = {
  email?: unknown;
  website?: unknown;
  userId?: unknown;
  password?: unknown;
  note?: unknown;
};

export type CleanInput = {
  email: string;
  emailValid: boolean;
  website: string;
  websiteValid: boolean;
  userId: string;
  userIdValid: boolean;
  passwordScore: number;
  passwordStrong: boolean;
  note: string;
};

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function scorePassword(password: string): number {
  return isStrongPassword(password, { returnScore: true }) as unknown as number;
}

export function cleanInput(input: RawInput): CleanInput {
  const email = trim(str(input.email));
  const website = trim(str(input.website));
  const userId = trim(str(input.userId)).toLowerCase();
  const password = str(input.password);
  const note = escape(trim(str(input.note)));

  return {
    email: normalizeEmail(email) || email,
    emailValid: isEmail(email),
    website,
    websiteValid: isURL(website, {
      require_protocol: true,
      protocols: ["http", "https"],
    }),
    userId,
    userIdValid: isUUID(userId, "4"),
    passwordScore: scorePassword(password),
    passwordStrong: isStrongPassword(password),
    note,
  };
}

import { cleanEnv, str, num, bool, port } from "envalid";

export function loadEnv(raw: Record<string, string | undefined>) {
  return cleanEnv(raw, {
    NODE_ENV: str({ choices: ["development", "test", "production"], default: "test" }),
    PORT: port({ default: 3000 }),
    MAX_WORKERS: num({ default: 2 }),
    FEATURE_X: bool({ default: false }),
    API_TOKEN: str({ default: "dev-token" }),
  }, {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length) {
        const msg = Object.entries(errors).map(([k, e]) => `${k}: ${(e as Error).message}`).join("; ");
        throw new Error(msg);
      }
    },
  });
}

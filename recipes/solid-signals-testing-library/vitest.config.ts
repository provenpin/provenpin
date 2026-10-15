import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()], // compiles Solid JSX into fine-grained DOM updates
  test: { environment: "jsdom" },
  resolve: { conditions: ["development", "browser"] }, // use Solid's browser build, not the SSR one
});

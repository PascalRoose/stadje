import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: [
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "lib/**/*.ts",
        "scripts/**/*.ts",
        "db/**/*.ts",
      ],
      exclude: ["**/*.d.ts", "**/node_modules/**", ".next/**"],
      thresholds: {
        perFile: false,
        lines: 75,
        statements: 75,
        functions: 75,
        branches: 85,
      },
    },
  },
});

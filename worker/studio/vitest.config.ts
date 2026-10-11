import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "../../tests/*.test.ts"],
    restoreMocks: true,
    clearMocks: true,
  },
});

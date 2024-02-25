import { defineConfig } from "tsup";

export default defineConfig((config) => {
  return {
    entry: ["src/index.ts"],
    bundle: config.platform === "browser",
    format: ["cjs"],
    outExtension:
      config.platform === "browser" ? () => ({ js: `.cjs` }) : undefined,
  };
});

import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		setupFiles: ["./tests/load-env.js"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
		},
		fileParallelism: false,
	},
});

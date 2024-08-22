import { describe, expect, test } from "vitest";
import { buildServer } from "../src/app.js";

describe("server", async () => {
	test("test GET /health route server close", async () => {
		const testServer = await buildServer();
		testServer.close();

		const response = await testServer.inject({
			method: "GET",
			url: "/health",
		});

		expect(response.statusCode).toBe(503);
		expect(response.statusMessage).toMatch("Service Unavailable");
	});
});

import { afterAll, describe, expect, test } from "vitest";
import { buildServer } from "../src/app.js";
import { client } from "../src/mongo-connection.js";

const server = await buildServer();
client.connect();

describe("health routes", () => {
	afterAll(async () => {
		await server.close();
	});

	test("test GET /health route server open", async () => {
		const response = await server.inject({
			method: "GET",
			url: "/health",
		});

		expect(response.statusCode).toBe(200);
	});

	test("test GET /health/db route db open", async () => {
		const response = await server.inject({
			method: "GET",
			url: "/health/db",
		});

		expect(response.statusCode).toBe(200);
		expect(response.statusMessage).toMatch("OK");
	});

	test("test GET /health/db route db close", async () => {
		await client.close();

		const response = await server.inject({
			method: "GET",
			url: "/health/db",
		});

		await client.connect();

		expect(response.statusCode).toBe(500);
		expect(response.statusMessage).toMatch("Internal Server Error");
	});
});

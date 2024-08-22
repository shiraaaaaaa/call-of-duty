import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "vitest";
import { buildServer } from "../src/app.js";
import { client } from "../src/mongo-connection.js";
import { getDuty } from "./data/duty-helper.js";
import { getSoldier } from "./data/soldier-helper.js";

let server;
await client.connect();
const db = await client.db(process.env.DB_NAME || "call-off-duty-test");
const soldiersCollection = await db.collection("soldier");
const dutiesCollection = await db.collection("duty");

describe("justice-board routes", () => {
	beforeAll(async () => {
		server = await buildServer();
	});
	afterAll(async () => {
		await db.dropCollection("duty");
		await server.close();
	});
	beforeEach(async () => {
		await soldiersCollection.deleteMany({});
		await dutiesCollection.deleteMany({});
	});
	describe("Get justice-board route", () => {
		test("should get the justice board", async () => {
			await dutiesCollection.insertMany([
				{
					...getDuty({
						soldiers: [getSoldier(), getSoldier({ _id: "0000015" })],
					}),
				},
				{ ...getDuty({ value: 10, soldiers: [getSoldier()] }) },
			]);
			await soldiersCollection.insertMany([
				getSoldier(),
				getSoldier({ _id: "0000015" }),
			]);

			const response = await server.inject({
				method: "GET",
				url: "/justice-board",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().justiceBoard).toStrictEqual([
				{ _id: "0000015", score: 5 },
				{ _id: "0000014", score: 15 },
			]);
		});
		test("should get the justice board when there are no duties", async () => {
			await soldiersCollection.insertMany([
				getSoldier(),
				getSoldier({ _id: "0000015" }),
			]);

			const response = await server.inject({
				method: "GET",
				url: "/justice-board",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().justiceBoard).toStrictEqual([
				{ _id: "0000014", score: 0 },
				{ _id: "0000015", score: 0 },
			]);
		});
		test("should return not found where there are no soldiers", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/justice-board",
			});

			expect(response.statusCode).toBe(404);
		});
	});
	describe("Get justice-board by id route", () => {
		beforeEach(async () => {
			await dutiesCollection.insertMany([
				{
					...getDuty({
						soldiers: [getSoldier(), getSoldier({ _id: "0000015" })],
					}),
				},
				{ ...getDuty({ value: 10, soldiers: [getSoldier()] }) },
			]);
			await soldiersCollection.insertMany([
				getSoldier(),
				getSoldier({ _id: "0000015" }),
			]);
		});
		test("should get the soldier score when the id is passed", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/justice-board/0000014",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().score).toBe(15);
		});

		test("should return not found score when the id that doesn't exist passed", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/justice-board/0000013",
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().message).toBe(
				"soldier with the id 0000013 not found",
			);
		});

		test("should throw error when the id is invalid", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/justice-board/000001",
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"params/id must NOT have fewer than 7 characters",
			);
		});
	});
});

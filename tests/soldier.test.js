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
let soldierCollection;
let dutyCollection;
await client.connect();
const db = await client.db(process.env.DB_NAME || "call-off-duty-test");

describe("soldiers routes", () => {
	beforeAll(async () => {
		server = await buildServer();
		soldierCollection = db.collection("soldier");
		dutyCollection = db.collection("duty");
	});
	beforeEach(async () => {
		await soldierCollection.deleteMany({});

		await soldierCollection.insertOne(getSoldier());
	});
	afterAll(async () => {
		await db.dropCollection("duty");
		await db.dropCollection("soldier");
		await server.close();
	});

	describe("POST /soldiers route", () => {
		beforeEach(async () => {
			await soldierCollection.deleteMany({});
		});

		test("should insert soldier object when body is correct", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/soldiers",
				body: getSoldier(),
			});

			const json = response.json();

			expect(response.statusCode).toBe(201);
			expect(json._id).toEqual("0000014");
			expect(
				json.createdAt && json.updatedAt && json.rank.name && json.rank.value,
			).toBeDefined();
		});

		test("should insert limitations in lower case when they are in upper case", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/soldiers",
				body: getSoldier(),
			});

			expect(response.statusCode).toBe(201);
			expect(response.json().limitations.toString()).toBe(
				["limiT1", "limit2"].toString().toLocaleLowerCase(),
			);
		});

		test("should throw error when the id is incorrect", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/soldiers",
				body: {
					_id: "00000",
					name: "meitav",
					rank: { value: 3 },
					limitations: ["limit1", "limit2"],
				},
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/_id must NOT have fewer than 7 characters",
			);
		});
		test("should throw error when the name is to long", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/soldiers",
				body: getSoldier({ name: "a".repeat(60) }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/name must NOT have more than 50 characters",
			);
		});
		test("should throw error when the name is to short", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/soldiers",
				body: getSoldier({ name: "12" }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/name must NOT have fewer than 3 characters",
			);
		});
		test("should throw error when the rank value is to high", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/soldiers",
				body: getSoldier({ rank: { value: 8 } }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/rank/value must be <= 6");
		});
		test("should throw error when the rank name isn't exist", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/soldiers",
				body: getSoldier({ rank: { name: "c" } }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/rank/name must be equal to one of the allowed values",
			);
		});
		test("should throw error when the limitations are an object", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/soldiers",
				body: getSoldier({ limitations: {} }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/limitations must be array");
		});
		test("should insert soldier without unknown fields when is given an incorrect field", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/soldiers",
				body: getSoldier({ incorrect: "3" }),
			});

			expect(response.statusCode).toBe(201);
			expect(response.json().incorrect).toBeUndefined();
		});
	});
	describe("GET /soldiers/:id route", () => {
		test("should return soldier when soldier is exist", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/soldiers/0000014",
			});

			expect(response.statusCode).toBe(200);
		});

		test("should return not found when soldier isn't exist", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/soldiers/0000010",
			});

			expect(response.statusCode).toBe(404);
		});
		test("should throw an error when the id is invalid", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/soldiers/000001",
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"params/id must NOT have fewer than 7 characters",
			);
		});
	});

	describe("GET /soldiers by query route", () => {
		test("should return all soldiers when there is no query string", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/soldiers",
			});

			expect(response.statusCode).toBe(200);
		});

		test("should return empty array when search non existing soldiers", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/soldiers?name=000001",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual([]);
		});
		test("should return soldier when query by rank name", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/soldiers?rankName=Lieutenant",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()[0]._id).toBe("0000014");
		});
		test("should return soldier when query by rank name", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/soldiers?rankValue=3",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()[0]._id).toBe("0000014");
		});
		test("should return soldier when query by limitations", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/soldiers?limitations=limit1,limit2",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()[0]._id).toBe("0000014");
		});
	});

	describe("DELETE /soldiers by id route", () => {
		beforeEach(async () => {
			await soldierCollection.deleteMany({});
			await dutyCollection.deleteMany({});
			await soldierCollection.insertOne(
				getSoldier({ rank: { name: "Colonel" } }),
			);
		});

		test("should delete soldier when the id is matching", async () => {
			const response = await server.inject({
				method: "DELETE",
				url: "/soldiers/0000014",
			});

			expect(response.statusCode).toBe(204);
		});

		test("should delete soldier and reschedule his duties when the id is matching and there are available soldiers", async () => {
			await soldierCollection.insertOne(getSoldier({ _id: "0000015" }));
			await dutyCollection.insertOne(
				getDuty({
					soldiers: [{ _id: "0000014" }],
					soldiersRequired: 1,
					status: "scheduled",
				}),
			);
			const response = await server.inject({
				method: "DELETE",
				url: "/soldiers/0000014",
			});

			const duty = await dutyCollection.findOne({});

			expect(response.statusCode).toBe(204);
			expect(duty.soldiers.length).toBe(1);
			expect(duty.soldiers[0]._id).toBe("0000015");
		});

		test("should delete soldier and unschedule his duties when the id is matching and there are no available soldiers", async () => {
			await dutyCollection.insertOne(
				getDuty({
					soldiers: [{ _id: "0000014" }],
					soldiersRequired: 1,
					status: "scheduled",
				}),
			);
			const response = await server.inject({
				method: "DELETE",
				url: "/soldiers/0000014",
			});

			const duty = await dutyCollection.findOne({});

			expect(response.statusCode).toBe(204);
			expect(duty.status).toBe("unscheduled");
			expect(duty.soldiers.length).toBe(0);
		});

		test("should return error when the id is invalid", async () => {
			const response = await server.inject({
				method: "DELETE",
				url: "/soldiers/000001",
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"params/id must NOT have fewer than 7 characters",
			);
		});

		test("should return not found when the id isn't matching", async () => {
			const response = await server.inject({
				method: "DELETE",
				url: "/soldiers/0000001",
			});

			expect(response.statusCode).toBe(404);
		});
	});

	describe("PATCH /soldiers route", () => {
		beforeEach(async () => {
			await soldierCollection.deleteMany({});
			await dutyCollection.deleteMany({});
			await soldierCollection.insertOne(
				getSoldier({ limitations: ["Night duty"] }),
			);
		});

		test("should return not found when the id don't exist", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: "/soldiers/0000015",
				body: getSoldier({ _id: "0000015" }),
			});

			expect(response.statusCode).toBe(404);
		});
		test("should update soldier and reschedule his duties when the id is matching and there are available soldiers", async () => {
			await soldierCollection.insertOne(getSoldier({ _id: "0000015" }));
			await dutyCollection.insertOne(
				getDuty({
					soldiers: [{ _id: "0000014" }],
					soldiersRequired: 1,
					status: "scheduled",
				}),
			);
			const response = await server.inject({
				method: "PATCH",
				url: "/soldiers/0000014",
				body: getSoldier({ limitations: ["day Light"] }),
			});

			const duty = await dutyCollection.findOne({});

			expect(response.statusCode).toBe(200);
			expect(duty.soldiers.length).toBe(1);
			expect(duty.soldiers[0]._id).toBe("0000015");
		});

		test("should update soldier and unschedule his duties when the id is matching and there are no available soldiers", async () => {
			await dutyCollection.insertOne(
				getDuty({
					soldiers: [{ _id: "0000014" }],
					soldiersRequired: 1,
					status: "scheduled",
				}),
			);
			const response = await server.inject({
				method: "PATCH",
				url: "/soldiers/0000014",
				body: getSoldier({ limitations: ["day Light"] }),
			});

			const duty = await dutyCollection.findOne({});

			expect(response.statusCode).toBe(200);
			expect(duty.status).toBe("unscheduled");
			expect(duty.soldiers.length).toBe(0);
		});

		test("should update soldier when the body is correct", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: "/soldiers/0000014",
				body: getSoldier(),
			});

			const json = response.json();

			expect(response.statusCode).toBe(200);
			expect(json._id).toEqual("0000014");
			expect(json.updatedAt && json.rank.name && json.rank.value).toBeDefined();
		});

		test("should insert limitations in lower case when they are in upper case", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: "/soldiers/0000014",
				body: getSoldier({ limitations: ["limiT4", "limit2"] }),
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().limitations.toString()).toBe(
				["limiT4", "limit2"].toString().toLocaleLowerCase(),
			);
		});

		test("should throw error when the id is incorrect", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: "/soldiers/0000014",
				body: getSoldier({ _id: "00000" }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/_id must NOT have fewer than 7 characters",
			);
		});
		test("should throw error when the name is to long", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: "/soldiers/0000014",
				body: getSoldier({ name: "a".repeat(60) }),
			});

			expect(response.statusCode).toBe(500);
		});
		test("should throw error when the name is to short", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: "/soldiers/0000014",
				body: getSoldier({ name: "12" }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/name must NOT have fewer than 3 characters",
			);
		});
		test("should throw error when the rank value is to high", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: "/soldiers/0000014",
				body: getSoldier({ rank: { value: 8 } }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/rank/value must be <= 6");
		});
		test("should throw error when the rank name isn't exist", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: "/soldiers/0000014",
				body: getSoldier({ rank: { name: "3" } }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/rank/name must be equal to one of the allowed values",
			);
		});
		test("should throw error when the limitations are an object", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: "/soldiers/0000014",
				body: getSoldier({ limitations: {} }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/limitations must be array");
		});
		test("should insert soldier without unknown fields when is given an incorrect field", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: "/soldiers/0000014",
				body: getSoldier({ incorrect: 3 }),
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().incorrect).toBeUndefined();
		});
	});

	describe("PUT limitations  by id route", () => {
		beforeEach(async () => {
			await soldierCollection.deleteMany({});
			await dutyCollection.deleteMany({});
			await soldierCollection.insertOne(
				getSoldier({ rank: { name: "Colonel" } }),
			);
		});

		test("should push the limitations when the array is correct", async () => {
			const response = await server.inject({
				method: "PUT",
				url: "/soldiers/0000014/limitations",
				body: {
					limitations: ["limit3", "limit4"],
				},
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().limitations).toStrictEqual([
				"limit1",
				"limit2",
				"limit3",
				"limit4",
			]);
		});
		test("should add limitations to soldier and reschedule his duties when the id is matching and there are available soldiers", async () => {
			await soldierCollection.insertOne(getSoldier({ _id: "0000015" }));
			await dutyCollection.insertOne(
				getDuty({
					soldiers: [{ _id: "0000014" }],
					soldiersRequired: 1,
					status: "scheduled",
				}),
			);
			const response = await server.inject({
				method: "PUT",
				url: "/soldiers/0000014/limitations",
				body: { limitations: ["day Light"] },
			});

			const duty = await dutyCollection.findOne({});

			expect(response.statusCode).toBe(200);
			expect(duty.soldiers.length).toBe(1);
			expect(duty.soldiers[0]._id).toBe("0000015");
		});

		test("should add limitations to soldier and unschedule his duties when the id is matching and there are no available soldiers", async () => {
			await dutyCollection.insertOne(
				getDuty({
					soldiers: [{ _id: "0000014" }],
					soldiersRequired: 1,
					status: "scheduled",
				}),
			);
			const response = await server.inject({
				method: "PUT",
				url: "/soldiers/0000014/limitations",
				body: { limitations: ["day Light"] },
			});

			const duty = await dutyCollection.findOne({});

			expect(response.statusCode).toBe(200);
			expect(duty.status).toBe("unscheduled");
			expect(duty.soldiers.length).toBe(0);
		});

		test("should throw error when the limitations are an object", async () => {
			const response = await server.inject({
				method: "PUT",
				url: "/soldiers/0000014/limitations",
				body: {
					limitations: { limit3: "limit4" },
				},
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/limitations must be array");
		});
		test("should push only uniq limitations when the array is correct", async () => {
			const response = await server.inject({
				method: "PUT",
				url: "/soldiers/0000014/limitations",
				body: {
					limitations: ["limit3", "limit2", "limit1"],
				},
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().limitations).toStrictEqual([
				"limit1",
				"limit2",
				"limit3",
			]);
		});
		test("should return not found when the id don't exist", async () => {
			const response = await server.inject({
				method: "PUT",
				url: "/soldiers/0000015/limitations",
				body: {
					limitations: ["limit3", "limit2", "limit1"],
				},
			});

			expect(response.statusCode).toBe(404);
		});
	});
});

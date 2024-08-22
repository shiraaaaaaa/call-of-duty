import { ObjectId } from "mongodb";
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
import { getDateByDaysOffset, getDuty } from "./data/duty-helper.js";
import { getSoldier } from "./data/soldier-helper.js";

await client.connect();
const db = await client.db(process.env.DB_NAME || "call-off-duty-test");

let server;
const dutyCollection = db.collection("duty");
let id;
const soldierCollection = db.collection("soldier");
const soldier15Id = "0000015";
const soldier16Id = "0000016";
const duty1Name = "duty1";

describe("duties routes", () => {
	beforeAll(async () => {
		server = await buildServer();
	});
	beforeEach(async () => {
		await dutyCollection.deleteMany({});
		await dutyCollection.insertOne(getDuty());

		id = (await dutyCollection.findOne({}))._id.toString();
	});
	afterAll(async () => {
		await db.dropCollection("duty");
		await db.dropCollection("soldier");
		await server.close();
	});

	describe("POST /duties route", () => {
		beforeEach(async () => {
			await dutyCollection.deleteMany({});
		});

		test("should insert duty object when body is correct", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty(),
			});

			const { name, status, statusHistory, soldiers } = response.json();

			expect(response.statusCode).toBe(201);
			expect(name).toEqual("Guard Duty");
			expect(status && statusHistory && soldiers).toBeDefined();
		});

		test("should insert constraints in lower case when they are in upper case", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty({ constraints: ["cOnstrain1", "coNstrain2"] }),
			});

			expect(response.statusCode).toBe(201);
			expect(response.json().constraints.toString()).toBe(
				["constrain1", "constrain2"].toString().toLocaleLowerCase(),
			);
		});

		test("should throw error when there is no description", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty({ description: undefined }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body must have required property 'description'",
			);
		});

		test("should throw error when the name is to long", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty({ name: "a".repeat(60) }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/name must NOT have more than 50 characters",
			);
		});

		test("should throw error when the name is to short", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty({ name: "a" }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/name must NOT have fewer than 3 characters",
			);
		});

		test("should throw error when the value is to low", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty({ value: 0 }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/value must be >= 1");
		});

		test("should throw error when the minRank is to high", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty({ minRank: 7 }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/minRank must be <= 6");
		});

		test("should throw error when the maxRank is to low", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty({ maxRank: -1 }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/maxRank must be >= 0");
		});

		test("Should throw error when the constrains are not a list", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty({ constraints: {} }),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/constraints must be array");
		});

		test("should throw error when the location type is invalid", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty({
					location: {
						type: "geoJson",
						coordinates: [30, 30],
					},
				}),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/location/type must be equal to one of the allowed values",
			);
		});

		test("should throw error when the location coordinates are invalid", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty({
					location: {
						type: "Point",
						coordinates: [30],
					},
				}),
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/location/coordinates must NOT have fewer than 2 items",
			);
		});

		test("should insert duty without unknown fields when is given an incorrect field", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty({ incorrect: 3 }),
			});

			expect(response.statusCode).toBe(201);
			expect(response.json().incorrect).toBeUndefined();
		});

		test("should throw an error when start time is in the past", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty({ startTime: new Date(0) }),
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().message).toBe("startTime must be in the future");
		});

		test("should throw an error when end time is before start time", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/duties",
				body: getDuty({ endTime: new Date(0) }),
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().message).toBe("endTime must be after startTime");
		});
	});
	describe("GET /duties/:id route", () => {
		test("should return duty when duty is exist", async () => {
			const response = await server.inject({
				method: "GET",
				url: `/duties/${id}`,
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()._id.toString()).toBe(id);
		});

		test("Should return not found when duty doesn't exist", async () => {
			const response = await server.inject({
				method: "GET",
				url: `/duties/${"1".repeat(24)}`,
			});

			expect(response.statusCode).toBe(404);
			expect(response.json().message).toBe(
				`duty with id: ${"1".repeat(24)} not found`,
			);
		});

		test("should throw an error when the id is invalid", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/duties/000001",
			});

			expect(response.statusCode).toBe(500);
		});
	});

	describe("GET /duties by query route", () => {
		test("should return all duties when there is no query string", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/duties",
			});

			expect(response.statusCode).toBe(200);
		});

		test("should return empty array when search non existing duties", async () => {
			const response = await server.inject({
				method: "GET",
				url: `/duties?name=${"1".repeat(24)}`,
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()).toStrictEqual([]);
		});

		test("should return duties that match when query by name", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/duties?name=Guard Duty",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()[0]._id).toBe(id);
		});

		test("should return duties that match when query by description", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/duties?description=Patrol the perimeter",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()[0]._id).toBe(id);
		});

		test("should return duties that match when query by location", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/duties?location=34.0522,-118.2437",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()[0]._id).toBe(id);
		});

		test("should return duties that match when query by constraints", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/duties?constraints=night%20duty,outdoor%20duty",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()[0]._id).toBe(id);
		});

		test("should return duties that match when query by soldiersRequired", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/duties?soldiersRequired=5",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()[0]._id).toBe(id);
		});

		test("should return duties that match when query by value", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/duties?value=5",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()[0]._id).toBe(id);
		});

		test("should return duties that match when query by minRank", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/duties?minRank=1",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()[0]._id).toBe(id);
		});

		test("should return duties that match when query by maxRank", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/duties?maxRank=4",
			});

			expect(response.statusCode).toBe(200);
			expect(response.json()[0]._id).toBe(id);
		});
	});

	describe("DELETE /duties by id route", () => {
		beforeEach(async () => {
			await dutyCollection.deleteMany({});
			await dutyCollection.insertOne(getDuty());

			id = (await dutyCollection.findOne({}))._id.toString();
		});

		test("should delete duty when the id is matching", async () => {
			const response = await server.inject({
				method: "DELETE",
				url: `/duties/${id}`,
			});

			expect(response.statusCode).toBe(204);
		});

		test("should return error when the id is invalid", async () => {
			const response = await server.inject({
				method: "DELETE",
				url: "/duties/000001",
			});

			expect(response.statusCode).toBe(500);
		});

		test("should return not found when the id doesn't matching", async () => {
			const response = await server.inject({
				method: "DELETE",
				url: `/duties/${"1".repeat(24)}`,
			});

			expect(response.statusCode).toBe(404);
		});

		test("should throw an error when trying to delete scheduled duty", async () => {
			await dutyCollection.updateOne(
				{ _id: new ObjectId(id) },
				{ $set: { status: "scheduled" } },
			);

			const response = await server.inject({
				method: "DELETE",
				url: `/duties/${id}`,
			});

			expect(response.statusCode).toBe(409);
			expect(response.json().message).toBe("duty already scheduled");
		});
	});

	describe("PATCH /duties by id route", () => {
		beforeEach(async () => {
			await dutyCollection.deleteMany({});

			await dutyCollection.insertOne(getDuty());

			id = (await dutyCollection.findOne({}))._id.toString();
		});

		test("should update duty object when body is correct", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: { name: "Gaur Duty" },
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().name).toBe("Gaur Duty");
		});

		test("should update constraints in lower case when they are in upper case", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					constraints: ["cOnstrain1", "coNstrain2"],
				},
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().constraints.toString()).toBe(
				["constrain1", "constrain2"].toString().toLocaleLowerCase(),
			);
		});

		test("should update status in and status history when update status", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					status: "scheduled",
				},
			});

			const json = response.json();

			expect(response.statusCode).toBe(200);
			expect(json.status).toBe("scheduled");
			expect(json.statusHistory.length).toBe(2);
		});

		test("should throw error when the name is to long", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					name: "a".repeat(60),
				},
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/name must NOT have more than 50 characters",
			);
		});

		test("should throw error when the name is to short", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					name: "a",
				},
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/name must NOT have fewer than 3 characters",
			);
		});

		test("should throw error when the value is to low", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					value: 0,
				},
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/value must be >= 1");
		});

		test("should throw error when the minRank is to high", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					minRank: 7,
				},
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/minRank must be <= 6");
		});

		test("should throw error when the maxRank is to low", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					maxRank: -1,
				},
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/maxRank must be >= 0");
		});

		test("should throw error when the constraints are an object", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					constraints: {},
				},
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/constraints must be array");
		});

		test("should throw error when the location type is invalid", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					location: {
						type: "geoJson",
						coordinates: [30, 30],
					},
				},
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/location/type must be equal to one of the allowed values",
			);
		});

		test("should throw error when the location coordinates are invalid", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					location: {
						type: "Point",
						coordinates: [30],
					},
				},
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe(
				"body/location/coordinates must NOT have fewer than 2 items",
			);
		});

		test("should update duty without unknown fields when is given an incorrect field", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					incorrect: 3,
				},
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().incorrect).toBeUndefined();
		});

		test("should throw an error when start time is in the past", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					startTime: new Date(0),
				},
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().message).toBe("startTime must be in the future");
		});

		test("should throw an error when end time is before start time", async () => {
			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					endTime: new Date(0),
				},
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().message).toBe("endTime must be after startTime");
		});

		test("should throw an error when try to update scheduled duty", async () => {
			dutyCollection.updateOne(
				{ _id: new ObjectId(id) },
				{ $set: { status: "scheduled" } },
			);

			const response = await server.inject({
				method: "PATCH",
				url: `/duties/${id}`,
				body: {
					name: "meitav",
				},
			});

			expect(response.statusCode).toBe(409);
			expect(response.json().message).toBe("duty already scheduled");
		});
	});

	describe("PUT constraints  by id route", () => {
		beforeEach(async () => {
			await dutyCollection.deleteMany({});
			await dutyCollection.insertOne(
				getDuty({ constraints: ["night duty", "outdoor duty"] }),
			);

			id = (await dutyCollection.findOne({}))._id.toString();
		});

		test("should push the constraints when the array is correct", async () => {
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${id}/constraints`,
				body: {
					constraints: ["constrain3", "constrain4"],
				},
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().constraints).toStrictEqual([
				"night duty",
				"outdoor duty",
				"constrain3",
				"constrain4",
			]);
		});

		test("should throw error when the constraints are an object", async () => {
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${id}/constraints`,
				body: {
					constraints: { constrain3: "constrain4" },
				},
			});

			expect(response.statusCode).toBe(500);
			expect(response.json().message).toBe("body/constraints must be array");
		});

		test("should push only uniq constraints when the array is correct", async () => {
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${id}/constraints`,
				body: {
					constraints: ["night duty", "outdoor duty", "constrain3"],
				},
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().constraints).toStrictEqual([
				"night duty",
				"outdoor duty",
				"constrain3",
			]);
		});

		test("should push low case constraints when the array is correct", async () => {
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${id}/constraints`,
				body: {
					constraints: ["constRain3"],
				},
			});

			expect(response.statusCode).toBe(200);
			expect(response.json().constraints).toStrictEqual([
				"night duty",
				"outdoor duty",
				"constrain3",
			]);
		});

		test("should return not found when the id don't exist", async () => {
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${"1".repeat(24)}/constraints`,
				body: {
					constraints: ["constrain3", "constrain2", "constrain1"],
				},
			});

			expect(response.statusCode).toBe(404);
		});
	});
	describe("PUT schedule duty by id route", () => {
		beforeEach(async () => {
			await dutyCollection.deleteMany({});
			await soldierCollection.deleteMany({});
		});

		test("should return the scheduled duty", async () => {
			await dutyCollection.insertOne(getDuty({ soldiersRequired: 2 }));
			await soldierCollection.insertMany([
				getSoldier(),
				getSoldier({ _id: soldier16Id }),
			]);
			id = (await dutyCollection.findOne({}))._id.toString();
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${id}/schedule`,
			});

			const { status, soldiers, statusHistory } = response.json();

			expect(response.statusCode).toBe(200);
			expect(status).toBe("scheduled");
			expect(soldiers.length).toBe(2);
			expect(statusHistory.length).toBe(2);
		});

		test("should return the schedule duty with soldiers with the lowest score", async () => {
			await dutyCollection.insertMany([
				getDuty({ name: duty1Name, soldiersRequired: 2 }),
				getDuty({
					soldiersRequired: 1,
					soldiers: [{ _id: soldier16Id }],
					startTime: getDateByDaysOffset(3).toISOString(),
					endTime: getDateByDaysOffset(4).toISOString(),
				}),
			]);
			await soldierCollection.insertMany([
				getSoldier(),
				getSoldier({ _id: soldier15Id }),
				getSoldier({ _id: soldier16Id }),
			]);
			const duty1Id = (
				await dutyCollection.findOne({ name: duty1Name })
			)._id.toString();
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${duty1Id}/schedule`,
			});

			const { status, soldiers } = response.json();

			expect(response.statusCode).toBe(200);
			expect(status).toBe("scheduled");
			expect(soldiers).toStrictEqual([
				{ _id: getSoldier()._id },
				{ _id: soldier15Id },
			]);
		});

		test("should not schedule the duty when there aren't enough available in the specific date of the duty", async () => {
			await dutyCollection.insertMany([
				getDuty({ name: duty1Name, soldiersRequired: 3 }),
				getDuty({
					soldiersRequired: 1,
					soldiers: [{ _id: soldier16Id }],
					startTime: getDateByDaysOffset(1.5),
					endTime: getDateByDaysOffset(1.75),
				}),
			]);
			await soldierCollection.insertMany([
				getSoldier(),
				getSoldier({ _id: soldier15Id }),
				getSoldier({ _id: soldier16Id }),
			]);
			const duty1Id = (
				await dutyCollection.findOne({ name: duty1Name })
			)._id.toString();
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${duty1Id}/schedule`,
			});

			expect(response.statusCode).toBe(409);
			expect(response.json().message).toBe(
				"don't have enough available soldiers for the duty",
			);
		});

		test("should not schedule duty when there aren't enough soldiers", async () => {
			await dutyCollection.insertOne(getDuty({ soldiersRequired: 2 }));
			await soldierCollection.insertOne(getSoldier());
			id = (await dutyCollection.findOne({}))._id.toString();
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${id}/schedule`,
			});

			expect(response.statusCode).toBe(409);
			expect(response.json().message).toBe(
				"don't have enough available soldiers for the duty",
			);
		});

		test("should not schedule duty when there aren't enough available soldiers", async () => {
			await dutyCollection.insertMany([
				getDuty({ name: duty1Name, soldiersRequired: 2 }),
				getDuty({
					soldiersRequired: 2,
					soldiers: [{ _id: soldier16Id }, { _id: soldier15Id }],
				}),
			]);
			await soldierCollection.insertMany([
				getSoldier(),
				getSoldier({ _id: soldier15Id }),
				getSoldier({ _id: soldier16Id }),
			]);
			id = (await dutyCollection.findOne({ name: duty1Name }))._id.toString();
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${id}/schedule`,
			});

			expect(response.statusCode).toBe(409);
			expect(response.json().message).toBe(
				"don't have enough available soldiers for the duty",
			);
		});

		test("should not schedule duty when duty already scheduled", async () => {
			await dutyCollection.insertOne(getDuty({ status: "scheduled" }));
			id = (await dutyCollection.findOne({}))._id.toString();
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${id}/schedule`,
			});

			expect(response.statusCode).toBe(409);
			expect(response.json().message).toBe("duty already scheduled");
		});

		test("should not schedule duty when duty status is canceled", async () => {
			await dutyCollection.insertOne(getDuty({ status: "canceled" }));
			id = (await dutyCollection.findOne({}))._id.toString();
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${id}/schedule`,
			});

			expect(response.statusCode).toBe(409);
			expect(response.json().message).toBe("duty already canceled");
		});

		test("should not schedule duty when duty start time is in the past", async () => {
			await dutyCollection.insertOne(getDuty({ startTime: new Date(0) }));
			id = (await dutyCollection.findOne({}))._id.toString();
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${id}/schedule`,
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().message).toBe("startTime must be in the future");
		});

		test("should return error when the id is invalid", async () => {
			const response = await server.inject({
				method: "PUT",
				url: "/duties/000001/schedule",
			});

			expect(response.statusCode).toBe(500);
		});

		test("should return not found when the id don't exist", async () => {
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${"1".repeat(24)}/schedule`,
			});

			expect(response.statusCode).toBe(404);
		});
	});

	describe("PUT cancel duty by id route", () => {
		beforeEach(async () => {
			await dutyCollection.deleteMany({});
			await soldierCollection.deleteMany({});
		});

		test("should cancel the duty", async () => {
			await dutyCollection.insertOne(
				getDuty({ soldiers: [{ _id: soldier16Id }] }),
			);
			id = (await dutyCollection.findOne({}))._id.toString();
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${id}/cancel`,
			});

			const { status, soldiers, statusHistory } = response.json();

			expect(response.statusCode).toBe(200);
			expect(status).toBe("canceled");
			expect(soldiers).toStrictEqual([]);
			expect(statusHistory.length).toBe(2);
		});

		test("should not cancel the duty when duty status is canceled", async () => {
			await dutyCollection.insertOne(getDuty({ status: "canceled" }));
			id = (await dutyCollection.findOne({}))._id.toString();
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${id}/cancel`,
			});

			expect(response.statusCode).toBe(409);
			expect(response.json().message).toBe("duty already canceled");
		});

		test("should not cancel duty when duty start time is in the past", async () => {
			await dutyCollection.insertOne(getDuty({ startTime: new Date(0) }));
			id = (await dutyCollection.findOne({}))._id.toString();
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${id}/cancel`,
			});

			expect(response.statusCode).toBe(400);
			expect(response.json().message).toBe("startTime must be in the future");
		});

		test("should return error when the id is invalid", async () => {
			const response = await server.inject({
				method: "PUT",
				url: "/duties/000001/cancel",
			});

			expect(response.statusCode).toBe(500);
		});

		test("should return not found when the id don't exist", async () => {
			const response = await server.inject({
				method: "PUT",
				url: `/duties/${"1".repeat(24)}/cancel`,
			});

			expect(response.statusCode).toBe(404);
		});
	});
});

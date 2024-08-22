import { ObjectId } from "mongodb";
import { client } from "../mongo-connection.js";

const collection = client
	.db(process.env.DB_NAME || "call-off-duty")
	.collection("duty");

const insertDuty = async (duty) => await collection.insertOne(duty);

const getDutiesByQuery = async (query) =>
	await collection.find(query).toArray();

const findDutyById = async (id) =>
	await collection.findOne({ _id: new ObjectId(id) });

const deleteDutyById = async (id) => {
	const response = await collection.deleteOne(matchUnscheduleDuty(id));

	return response.deletedCount;
};

const getAllUnScheduledDutiesIds = async () =>
	await collection
		.find({ status: { $ne: ["scheduled", "canceled"] } }, { _id: 1 })
		.sort({ value: -1 })
		.toArray();

const updateDuty = async (id, dutyToUpdate, statusHistory) => {
	const updatedDuty = await collection.findOneAndUpdate(
		matchUnscheduleDuty(id),
		{ $set: { ...dutyToUpdate }, $addToSet: { statusHistory: statusHistory } },
		{ returnDocument: "after" },
	);

	return updatedDuty;
};

const addConstraints = async (id, constraints) => {
	const updatedDuty = await collection.findOneAndUpdate(
		matchValidToScheduleDuty(id),
		{
			$addToSet: { constraints: { $each: constraints } },
			$set: { updatedAt: new Date() },
		},
		{ returnDocument: "after" },
	);

	return updatedDuty;
};

const matchUnscheduleDuty = (id) => {
	return {
		_id: new ObjectId(id),
		status: { $ne: "scheduled" },
	};
};

const matchValidToScheduleDuty = (id) => {
	return {
		_id: new ObjectId(id),
		status: {
			$nin: ["scheduled", "canceled"],
		},
		startTime: {
			$gte: new Date(),
		},
	};
};

const scheduleDutyById = async (id, availableSoldiers) => {
	const updatedDuty = await collection.findOneAndUpdate(
		matchValidToScheduleDuty(id),
		{
			$set: { soldiers: availableSoldiers, status: "scheduled" },
			$push: { statusHistory: { status: "scheduled", date: new Date() } },
		},
		{ returnDocument: "after" },
	);

	return updatedDuty;
};

const cancelDutyById = async (id) => {
	const canceledDuty = await collection.findOneAndUpdate(
		{ ...matchValidToScheduleDuty(id), status: { $ne: "canceled" } },
		{
			$set: { status: "canceled", soldiers: [] },
			$push: { statusHistory: { status: "canceled", date: new Date() } },
		},
		{ returnDocument: "after" },
	);
	return canceledDuty;
};

const getDutiesBySoldierId = async (soldierId) =>
	await collection
		.find({
			status: "scheduled",
			soldiers: { $elemMatch: { _id: soldierId } },
			startTime: {
				$gte: new Date(),
			},
		})
		.toArray();

const updateSoldiersInDuty = async (dutyId, soldiers) =>
	await collection.updateOne(
		{ _id: new ObjectId(dutyId) },
		{ $set: { soldiers } },
	);

const unscheduleDuty = async (id) => {
	await collection.updateOne(
		{ _id: new ObjectId(id) },
		{
			$set: { soldiers: [], status: "unscheduled" },
			$push: { statusHistory: { status: "unscheduled", date: new Date() } },
		},
	);
};

export {
	insertDuty,
	getDutiesByQuery,
	findDutyById,
	deleteDutyById,
	updateDuty,
	addConstraints,
	scheduleDutyById,
	cancelDutyById,
	getDutiesBySoldierId,
	updateSoldiersInDuty,
	unscheduleDuty,
	getAllUnScheduledDutiesIds as getAllUnScheduledDuties,
};

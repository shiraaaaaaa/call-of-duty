import { client } from "../mongo-connection.js";

const collection = client
	.db(process.env.DB_NAME || "call-off-duty")
	.collection("soldier");

const insertSolider = async (soldier) => await collection.insertOne(soldier);

const findSoldierById = async (id) => await collection.findOne({ _id: id });

const findSoldiersByQuery = async (query) =>
	await collection.find(query).toArray();

const deleteSoldierById = async (id) => {
	const response = await collection.deleteOne({ _id: id });

	return response.deletedCount;
};

const updateSoldierById = async (id, soldierToUpdate) => {
	const updatedSoldier = await collection.findOneAndUpdate(
		{ _id: id },
		{ $set: soldierToUpdate },
		{ returnDocument: "after" },
	);

	return updatedSoldier;
};

const putLimitations = async (id, limitations) => {
	const updatedSoldier = await collection.findOneAndUpdate(
		{ _id: id },
		{
			$addToSet: { limitations: { $each: limitations } },
			$set: { updatedAt: new Date() },
		},
		{ returnDocument: "after" },
	);

	return updatedSoldier;
};

const justiceBoardAggregation = [
	{
		$lookup: {
			from: "duty",
			localField: "_id",
			foreignField: "soldiers._id",
			as: "duties",
		},
	},
	{
		$project: {
			_id: {
				$toString: "$_id",
			},
			score: {
				$sum: "$duties.value",
			},
		},
	},
	{
		$sort: { score: 1 },
	},
];

const generateJusticeBoard = async () =>
	await collection.aggregate(justiceBoardAggregation).toArray();

const getScore = async (id) =>
	(
		await collection
			.aggregate([
				{
					$match: { _id: id },
				},
				...justiceBoardAggregation,
			])
			.toArray()
	)[0];

const getAvailableSoldiers = async (duty) => {
	const minRank = duty?.minRank ?? 0;
	const maxRank = duty?.maxRank ?? Number.MAX_SAFE_INTEGER;

	return await collection
		.aggregate([
			{
				$lookup: {
					from: "duty",
					localField: "_id",
					foreignField: "soldiers._id",
					as: "duties",
				},
			},
			{
				$addFields: {
					score: {
						$sum: "$duties.value",
					},
				},
			},
			{
				$match: {
					duties: {
						$not: {
							$elemMatch: {
								startTime: { $lte: new Date(duty.endTime) },
								endTime: { $gte: new Date(duty.startTime) },
							},
						},
					},
					"rank.value": {
						$gte: minRank,
						$lte: maxRank,
					},
				},
			},
			{
				$sort: {
					score: 1,
				},
			},
			{
				$project: {
					_id: 1,
				},
			},
		])
		.toArray();
};

export {
	insertSolider,
	findSoldierById,
	findSoldiersByQuery,
	deleteSoldierById,
	updateSoldierById,
	putLimitations,
	generateJusticeBoard,
	getScore,
	getAvailableSoldiers,
};

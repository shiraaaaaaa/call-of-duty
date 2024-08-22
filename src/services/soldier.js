import { getRankValueByName, rankNameByValue } from "../models/Soldier.js";
import {
	findSoldiersByQuery,
	insertSolider,
	updateSoldierById,
} from "../repositories/soldier.js";

const getSoldiersByQuery = async (reqQuery) => {
	if (reqQuery.limitations)
		reqQuery.limitations = reqQuery.limitations.toString().split(",");

	if (reqQuery.rankValue ?? reqQuery.rankName) {
		reqQuery.rank = {
			value: reqQuery.rankValue ?? getRankValueByName(reqQuery.rankName),
		};
		delete reqQuery.rankValue;
		delete reqQuery.rankName;
	}

	return findSoldiersByQuery(reqQuery);
};

const postSoldier = async (soldierToAdd) => {
	const now = new Date();
	const soldier = {
		...soldierToAdd,
		createdAt: now,
		updatedAt: now,
		limitations: soldierToAdd.limitations.map((limitation) =>
			limitation.toLowerCase(),
		),
		rank: {
			value:
				soldierToAdd.rank.value ?? getRankValueByName(soldierToAdd.rank.name),
			name: soldierToAdd.rank.name || rankNameByValue[soldierToAdd.rank.value],
		},
	};

	await insertSolider(soldier);

	return soldier;
};

const updateSoldier = async (id, soldierToUpdate) => {
	let { _id, ...soldier } = soldierToUpdate;

	soldier = {
		...soldier,
		updatedAt: new Date(),
		limitations: soldierToUpdate.limitations.map((limit) =>
			limit.toLowerCase(),
		),
		rank: {
			name:
				soldierToUpdate.rank.name ||
				rankNameByValue[soldierToUpdate.rank.value],
			value:
				soldierToUpdate.rank.value ??
				getRankValueByName(soldierToUpdate.rank.name),
		},
	};

	return await updateSoldierById(id, soldier);
};

export { getSoldiersByQuery, postSoldier, updateSoldier };

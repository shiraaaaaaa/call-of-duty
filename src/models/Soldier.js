import {
	addSoldier,
	deleteSoldier,
	findSoldiersByQuery,
	getSoldier,
	patchSoldier,
	updateLimitations,
} from "../controllers/soldier.js";

const SoldierReq = {
	type: "object",
	required: ["_id", "name", "limitations", "rank"],
	additionalProperties: false,
	properties: {
		_id: { type: "string", minLength: 7, maxLength: 7 },
		name: { type: "string", minLength: 3, maxLength: 50 },
		rank: {
			type: "object",
			anyOf: [{ required: ["value"] }, { required: ["name"] }],
			additionalProperties: false,
			properties: {
				value: { type: "integer", minimum: 0, maximum: 6 },
				name: {
					type: "string",
					enum: [
						"Private",
						"Corporal",
						"Sergeant",
						"Lieutenant",
						"Captain",
						"Major",
						"Colonel",
					],
				},
			},
		},
		limitations: {
			type: "array",
			items: { type: "string" },
			minItems: 1,
		},
	},
};

const SoldierRes = {
	type: "object",
	additionalProperties: false,
	properties: {
		...SoldierReq.properties,
		updatedAt: { type: "string" },
		createdAt: { type: "string" },
	},
};

const rankNameByValue = {
	0: "Private",
	1: "Corporal",
	2: "Sergeant",
	3: "Lieutenant",
	4: "Captain",
	5: "Major",
	6: "Colonel",
};

const getRankValueByName = (value) => {
	return Number.parseInt(
		Object.keys(rankNameByValue).find((key) => rankNameByValue[key] === value),
	);
};

const postSoliderOpts = {
	schema: {
		body: {
			...SoldierReq,
		},
		response: {
			201: SoldierRes,
		},
	},
	handler: addSoldier,
};

const getSoldierOpts = {
	schema: {
		params: {
			type: "object",
			required: ["id"],
			additionalProperties: false,
			properties: {
				id: SoldierReq.properties._id,
			},
		},
	},

	handler: getSoldier,
};

const getSoldiersByQueryOpts = {
	schema: {
		query: {
			type: "object",
			additionalProperties: false,
			properties: {
				name: SoldierReq.properties.name,
				rankName: SoldierReq.properties.rank.properties.name,
				rankValue: SoldierReq.properties.rank.properties.value,
				limitations: SoldierReq.properties.limitations,
			},
		},
	},

	handler: findSoldiersByQuery,
};

const deleteSoldierOpts = {
	schema: {
		params: {
			type: "object",
			required: ["id"],
			additionalProperties: false,
			properties: {
				id: SoldierReq.properties._id,
			},
		},
	},

	handler: deleteSoldier,
};

const updateSoliderOpts = {
	schema: {
		body: SoldierReq,
		response: {
			200: SoldierRes,
		},
	},
	handler: patchSoldier,
};

const updateLimitationsOpts = {
	schema: {
		body: {
			type: "object",
			required: ["limitations"],
			properties: {
				limitations: SoldierReq.properties.limitations,
			},
		},
		response: {
			200: SoldierRes,
		},
	},

	handler: updateLimitations,
};

export {
	rankNameByValue,
	getRankValueByName,
	postSoliderOpts,
	getSoldierOpts,
	getSoldiersByQueryOpts,
	deleteSoldierOpts,
	updateSoliderOpts,
	updateLimitationsOpts,
	SoldierRes,
};

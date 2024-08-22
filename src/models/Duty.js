import {
	addConstraintsById,
	addDuty,
	cancelDutyById,
	deleteDutyById,
	getDutiesByQuery,
	getDuty,
	scheduledDuty,
	updateDuty,
} from "../controllers/duty.js";
import { SoldierRes } from "./Soldier.js";
const dutyRequest = {
	type: "object",
	required: [
		"name",
		"description",
		"location",
		"startTime",
		"endTime",
		"constraints",
		"soldiersRequired",
		"value",
	],
	additionalProperties: false,
	properties: {
		name: { type: "string", maxLength: 50, minLength: 3 },
		description: { type: "string" },
		location: {
			type: "object",
			properties: {
				type: { type: "string", enum: ["Point"] },
				coordinates: {
					type: "array",
					items: { type: "number" },
					minItems: 2,
					maxItems: 2,
				},
			},
			required: ["type", "coordinates"],
		},
		endTime: { type: "string", format: "date-time" },
		startTime: {
			type: "string",
			format: "date-time",
		},
		constraints: { type: "array", items: { type: "string" } },
		soldiersRequired: { type: "number" },
		value: { type: "number", minimum: 1 },
		minRank: { type: "number", minimum: 0, maximum: 6 },
		maxRank: { type: "number", minimum: 0, maximum: 6 },
	},
};

const dutyResult = {
	type: "object",
	additionalProperties: false,
	properties: {
		_id: { type: "string" },
		...dutyRequest.properties,
		soldiers: { type: "array", items: SoldierRes },
		status: { type: "string" },
		statusHistory: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					status: { type: "string" },
					date: { type: "string" },
				},
			},
		},
		updatedAt: { type: "string" },
		createdAt: { type: "string" },
	},
};

const postDutyOpts = {
	schema: {
		body: {
			...dutyRequest,
		},
		response: {
			201: dutyResult,
		},
	},
	handler: addDuty,
};

const getDutiesByQueryOpts = {
	schema: {
		query: {
			type: "object",
			additionalProperties: false,
			properties: {
				...dutyResult.properties,
				location: { type: "string" },
			},
		},
	},
	handler: getDutiesByQuery,
};

const getDutyOpts = {
	schema: {
		params: {
			type: "object",
			required: ["id"],
			additionalProperties: false,
			properties: {
				id: dutyResult.properties._id,
			},
		},
	},

	handler: getDuty,
};

const deleteDutyOpts = {
	schema: {
		params: {
			type: "object",
			required: ["id"],
			additionalProperties: false,
			properties: {
				id: dutyResult.properties._id,
			},
		},
	},

	handler: deleteDutyById,
};

const updateDutyOpts = {
	schema: {
		body: {
			type: "object",
			additionalProperties: false,
			properties: {
				...dutyRequest.properties,
				status: dutyResult.properties.status,
				soldiers: dutyResult.properties.soldiers,
			},
		},
		response: {
			200: dutyResult,
		},
	},

	handler: updateDuty,
};

const updateConstraintsOpts = {
	schema: {
		body: {
			type: "object",
			required: ["constraints"],
			properties: {
				constraints: dutyRequest.properties.constraints,
			},
		},
		response: {
			200: dutyResult,
		},
	},

	handler: addConstraintsById,
};

const scheduledDutyOpts = {
	scheme: {
		params: {
			type: "object",
			required: ["id"],
			additionalProperties: false,
			properties: {
				id: dutyResult.properties._id,
			},
		},
		response: {
			200: dutyResult,
		},
	},

	handler: scheduledDuty,
};

const cancelDutyOpts = {
	scheme: scheduledDutyOpts.scheme,
	handler: cancelDutyById,
};

export {
	dutyRequest,
	dutyResult,
	postDutyOpts,
	getDutiesByQueryOpts,
	getDutyOpts,
	deleteDutyOpts,
	updateDutyOpts,
	updateConstraintsOpts,
	scheduledDutyOpts,
	cancelDutyOpts,
};

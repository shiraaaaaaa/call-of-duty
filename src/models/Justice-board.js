import {
	getJusticeBoard,
	getSoldierScore,
} from "../controllers/justice-board.js";
import { SoldierRes } from "./Soldier.js";

const getJusticeBoardOpts = {
	schema: {
		response: {
			200: {
				type: "object",
				additionalProperties: false,
				properties: {
					justiceBoard: {
						type: "array",
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								_id: { type: "string" },
								score: { type: "number" },
							},
						},
					},
				},
			},
		},
	},

	handler: getJusticeBoard,
};

const getSoldierScoreOpts = {
	schema: {
		params: {
			type: "object",
			required: ["id"],
			additionalProperties: false,
			properties: {
				id: SoldierRes.properties._id,
			},
		},
		response: {
			200: {
				type: "object",
				additionalProperties: false,
				properties: {
					score: { type: "number" },
				},
			},
		},
	},

	handler: getSoldierScore,
};

export { getJusticeBoardOpts, getSoldierScoreOpts };

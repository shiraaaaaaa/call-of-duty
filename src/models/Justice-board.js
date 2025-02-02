import {
	getJusticeBoard,
	getSoldierScore,
} from "../controllers/justice-board.js";
import { SoldierRes } from "./Soldier.js";

const getJusticeBoardOpts = {
	schema: {
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
	},

	handler: getSoldierScore,
};

export { getJusticeBoardOpts, getSoldierScoreOpts };

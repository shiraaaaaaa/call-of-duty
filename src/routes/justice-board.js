import {
	getJusticeBoardOpts,
	getSoldierScoreOpts,
} from "../models/Justice-board.js";

const justiceBoardRoutes = async (fastify, options) => {
	await fastify.get("/", getJusticeBoardOpts);
	await fastify.get("/:id", getSoldierScoreOpts);
};

export default justiceBoardRoutes;

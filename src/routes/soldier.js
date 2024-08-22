import {
	deleteSoldierOpts,
	getSoldierOpts,
	getSoldiersByQueryOpts,
	postSoliderOpts,
	updateLimitationsOpts,
	updateSoliderOpts,
} from "../models/Soldier.js";

const soldierRoutes = async (fastify, options) => {
	await fastify.post("/", postSoliderOpts);
	await fastify.get("/:id", getSoldierOpts);
	await fastify.get("/", getSoldiersByQueryOpts);
	await fastify.delete("/:id", deleteSoldierOpts);
	await fastify.patch("/:id", updateSoliderOpts);
	await fastify.put("/:id/limitations", updateLimitationsOpts);
};

export default soldierRoutes;

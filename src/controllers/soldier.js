import {
	deleteSoldierById,
	findSoldierById,
	putLimitations,
} from "../repositories/soldier.js";
import { rescheduleDutiesBySoldierId } from "../services/duty.js";
import {
	getSoldiersByQuery,
	postSoldier,
	updateSoldier,
} from "../services/soldier.js";

const addSoldier = async (request, reply) => {
	const soldierToCreate = request.body;
	request.log.info({ soldierId: soldierToCreate._id }, "Creating new soldier");

	const soldier = await postSoldier(soldierToCreate);
	request.log.info("new soldier created");

	reply.code(201).send(soldier);
};

const getSoldier = async (request, reply) => {
	const { id } = request.params;
	const soldier = await findSoldierById(id);

	if (!soldier)
		return reply.code(404).send({ soldierId: id }, "soldier not found");

	request.log.info(`found the soldier ${soldier._id}`);

	reply.code(200).send(soldier);
};

const findSoldiersByQuery = async (request, reply) => {
	request.log.info({ query: request.query });
	const soldiers = await getSoldiersByQuery(request.query);

	request.log.info(soldiers.length, "soldiers found");

	reply.code(200).send(soldiers);
};

const deleteSoldier = async (request, reply) => {
	const { id } = request.params;
	const deleted = await deleteSoldierById(id);
	await rescheduleDutiesBySoldierId(id);

	if (!deleted) {
		request.log.warn({ id }, "soldier not found");
		return reply.code(404).send(`soldier with the id ${id} not found`);
	}

	request.log.info(`deleted ${id} soldier`);

	reply.code(204).send(`soldier: ${id}, deleted successfully`);
};

const patchSoldier = async (request, reply) => {
	const { id } = request.params;
	const update = await updateSoldier(id, request.body);

	if (!update) {
		request.log.warn(`soldier with the id ${id} not found`);
		return reply.code(404).send(`soldier with the id ${id} not found`);
	}

	request.log.info(`updated ${id} soldier`);

	await rescheduleDutiesBySoldierId(id);

	reply.code(200).send(update);
};

const updateLimitations = async (request, reply) => {
	const { id } = request.params;
	let { limitations } = request.body;

	limitations = limitations.map((limit) => limit.toLowerCase());

	const updateSoldier = await putLimitations(id, limitations);

	if (!updateSoldier) {
		request.log.warn({ id }, "soldier not found");
		reply.code(404).send(`soldier with the id ${id} not found`);
	}

	await rescheduleDutiesBySoldierId(id);

	reply.code(200).send(updateSoldier);
};

export {
	addSoldier,
	getSoldier,
	findSoldiersByQuery,
	deleteSoldier,
	patchSoldier,
	updateLimitations,
};

import {
	cancelDuty,
	createDuty,
	deleteDuty,
	findDutiesByQuery,
	patchDuty,
	scheduledDutyById,
	validateTimes,
} from "../services/duty.js";

import { addConstraints, findDutyById } from "../repositories/duty.js";

const addDuty = async (request, reply) => {
	const dutyToAdd = request.body;
	validateTimes(dutyToAdd.startTime, dutyToAdd.endTime);

	request.log.info({ dutyName: dutyToAdd.name }, "Creating new duty");

	const newDuty = await createDuty(dutyToAdd);
	request.log.info(`duty with id: ${newDuty._id} created`);

	return reply.code(201).send(newDuty);
};

const getDutiesByQuery = async (request, reply) => {
	request.log.info("searching query: ", { requestQuery: request.query });
	const duties = await findDutiesByQuery(request.query);

	request.log.info(`found ${duties.length} duties`);

	reply.code(200).send(duties);
};

const getDuty = async (request, reply) => {
	const { id } = request.params;
	request.log.info(`searching duty with id: ${id}`);

	const duty = await findDutyById(id);

	if (!duty) {
		request.log.warn(`duty with id: ${id} not found`);
		return reply.code(404).send({ message: `duty with id: ${id} not found` });
	}

	request.log.info(`find the duty ${id}`);

	reply.code(200).send(duty);
};

const deleteDutyById = async (request, reply) => {
	const { id } = request.params;
	request.log.info(`try delete duty with id: ${id}`);

	const deletedDutyCount = await deleteDuty(id);

	if (!deletedDutyCount) {
		request.log.warn({ id }, "duty not found so not deleted");
		return reply
			.code(404)
			.send({ message: `duty with the id ${id} not found so not deleted` });
	}

	request.log.info(`deleted ${id} duty successfully`);

	reply.code(204).send({ message: `duty: ${id}, deleted successfully` });
};
const updateDuty = async (request, reply) => {
	const { id } = request.params;
	request.log.info(`try to update duty with id: ${id}`);

	const updatedDuty = await patchDuty(id, request.body);

	if (!updatedDuty) {
		request.log.warn({ id }, "duty not found so not updated");
		return reply
			.code(404)
			.send({ message: `duty with the id ${id} not found so not updated` });
	}

	request.log.info(`updated ${id} duty`);

	reply.code(200).send(updatedDuty);
};

const addConstraintsById = async (request, reply) => {
	const { id } = request.params;
	const { constraints } = request.body;
	request.log.info(`try to add constraints in duty with id: ${id}`);

	const constraintsInLowerCase = constraints.map((constraint) =>
		constraint.toLowerCase(),
	);

	const updatedDuty = await addConstraints(id, constraintsInLowerCase);

	if (!updatedDuty) {
		request.log.warn({ id }, "duty not found so no constrains added");
		return reply.code(404).send({
			message: `duty with the id ${id} not found so no constrains added`,
		});
	}

	request.log.info(`add constraints in duty with id: ${id}`);
	reply.code(200).send(updatedDuty);
};

const scheduledDuty = async (request, reply) => {
	const { id } = request.params;
	request.log.info(`scheduling the duty ${id}`);

	const scheduledDuty = await scheduledDutyById(id);
	request.log.info(`duty with id: ${id} scheduled successfully`);

	reply.code(200).send(scheduledDuty);
};

const cancelDutyById = async (request, reply) => {
	const { id } = request.params;
	request.log.info(`canceling the duty ${id}`);

	const canceledDuty = await cancelDuty(id);
	request.log.info(`duty with id: ${id} canceled successfully`);

	reply.code(200).send(canceledDuty);
};

export {
	addDuty,
	getDutiesByQuery,
	getDuty,
	deleteDutyById,
	updateDuty,
	addConstraintsById,
	scheduledDuty,
	cancelDutyById,
};

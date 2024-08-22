import { HttpStatusError } from "../errors/httpStatusError.js";
import {
	cancelDutyById,
	deleteDutyById,
	findDutyById,
	getDutiesByQuery,
	getDutiesBySoldierId,
	insertDuty,
	scheduleDutyById,
	unscheduleDuty,
	updateDuty,
	updateSoldiersInDuty,
} from "../repositories/duty.js";
import { getAvailableSoldiers } from "../repositories/soldier.js";

const validateTimes = (startTime, endTime) => {
	const start = new Date(startTime);
	const end = new Date(endTime);

	if (start <= Date.now()) {
		throw new HttpStatusError("startTime must be in the future", 400);
	}

	if (start.getTime() >= end.getTime()) {
		throw new HttpStatusError("endTime must be after startTime", 400);
	}

	return true;
};

const createDuty = async (newDuty) => {
	const status = "unscheduled";
	const now = new Date();
	const duty = {
		...newDuty,
		startTime: new Date(newDuty.startTime),
		endTime: new Date(newDuty.endTime),
		constraints: newDuty.constraints.map((constrain) =>
			constrain.toLowerCase(),
		),
		soldiers: [],
		status,
		statusHistory: [{ status: status, date: now }],
		createdAt: now,
		updatedAt: now,
	};

	await insertDuty(duty);

	return duty;
};

const findDutiesByQuery = async (reqQuery) => {
	const query = {
		...reqQuery,
	};

	if (query.constraints)
		query.constraints = await query.constraints.toString().split(",");

	if (query.statusHistory)
		query.constraints = await query.statusHistory.toString().split(",");

	if (query.location)
		query.location = {
			type: "Point",
			coordinates: await reqQuery?.location
				?.split(",")
				.map((coordinate) => Number.parseFloat(coordinate)),
		};

	console.info("searching by: ", { query });

	return await getDutiesByQuery(query);
};

const deleteDuty = async (id) => {
	const deleteCount = await deleteDutyById(id);

	if (!deleteCount) validateStatus(await findDutyById(id), "scheduled");

	return deleteCount;
};

const patchDuty = async (id, dutyFieldsToUpdate) => {
	const now = new Date();
	const { startTime, endTime, status } = dutyFieldsToUpdate;

	if (startTime || endTime) {
		const dutyToUpdate = await findDutyById(id);
		validateTimes(
			startTime || dutyToUpdate.startTime,
			endTime || dutyToUpdate.endTime,
		);
	}

	const dutyFields = {
		...dutyFieldsToUpdate,
		updatedAt: now,
		constraints: dutyFieldsToUpdate?.constraints?.map((constrain) =>
			constrain.toLowerCase(),
		),
	};

	let updatedDuty;

	if (status) {
		updatedDuty = await updateDuty(id, dutyFields, {
			status: dutyFields.status,
			date: now,
		});
	} else {
		updatedDuty = await updateDuty(id, dutyFields);
	}

	if (!updatedDuty) validateStatus(await findDutyById(id), "scheduled");

	return updatedDuty;
};

const validateStatus = (duty, status) => {
	if (duty?.status?.toLowerCase() === status)
		throw new HttpStatusError(`duty already ${status}`, 409);
};

const scheduledDutyById = async (id) => {
	const duty = await findDutyById(id);

	if (!duty) throw new HttpStatusError(`duty with id: ${id} not found`, 404);

	validateTimes(duty.startTime);
	validateStatus(duty, "scheduled");
	validateStatus(duty, "canceled");

	const availableSoldiers = await getAvailableSoldiers(duty);

	if (availableSoldiers.length < duty.soldiersRequired) {
		throw new HttpStatusError(
			"don't have enough available soldiers for the duty",
			409,
		);
	}

	const scheduledDuty = await scheduleDutyById(
		duty._id,
		availableSoldiers.slice(0, duty.soldiersRequired),
	);

	return scheduledDuty;
};

const cancelDuty = async (id) => {
	const duty = await findDutyById(id);

	if (!duty) throw new HttpStatusError(`duty with id: ${id} not found`, 404);

	validateTimes(duty.startTime);
	validateStatus(duty, "canceled");

	const canceledDuty = await cancelDutyById(id);

	return canceledDuty;
};

const rescheduleDutiesBySoldierId = async (soldierId) => {
	const dutiesBySoldierId = await getDutiesBySoldierId(soldierId);
	const rescheduleDutiesIds = [];
	const failedRescheduleDutiesIds = [];

	for (const duty of dutiesBySoldierId) {
		const dutyId = duty._id;
		const availableSoldiers = await getAvailableSoldiers(duty);

		try {
			await replaceSoldierInDuty(dutyId, soldierId, availableSoldiers[0]);

			rescheduleDutiesIds.push(dutyId);
		} catch (error) {
			console.log(
				`can't reschedule duty with id: ${dutyId} , message: ${error.message}`,
			);
			failedRescheduleDutiesIds.push({ id: dutyId, error: error.message });
		}
	}

	console.log(
		`reschedule duties: ${rescheduleDutiesIds.toString()}, failed to reschedule duties: ${failedRescheduleDutiesIds.toString()}`,
	);
};

const replaceSoldierInDuty = async (dutyId, soldierId, soldierToAdd) => {
	if (!soldierToAdd) {
		await unscheduleDuty(dutyId);
		throw new Error(`no replacement Soldier was found for duty: ${dutyId}`);
	}

	const { soldiers } = { ...(await findDutyById(dutyId)) };

	if (!soldiers) {
		throw new HttpStatusError(`duty with id: ${dutyId} not found`, 404);
	}

	const indexToReplace = soldiers.findIndex(
		(soldier) => soldier._id === soldierId,
	);

	soldiers[indexToReplace] = soldierToAdd;

	await updateSoldiersInDuty(dutyId, soldiers);
};

export {
	validateTimes,
	createDuty,
	findDutiesByQuery,
	deleteDuty,
	patchDuty,
	scheduledDutyById,
	cancelDuty,
	rescheduleDutiesBySoldierId,
};

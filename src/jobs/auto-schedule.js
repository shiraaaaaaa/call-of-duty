import {
	getAllUnScheduledDuties,
	scheduleDutyById,
} from "../repositories/duty.js";

const scheduleAllDuties = async () => {
	const dutiesIdsToSchedule = await getAllUnScheduledDuties();
	for (const duty of dutiesIdsToSchedule) {
		await scheduleDutyById(duty);
	}
};

export { scheduleAllDuties };

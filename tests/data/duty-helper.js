const DAY = 86400000;

const getDateByDaysOffset = (daysToAdd) =>
	new Date(Date.now() + DAY * daysToAdd);

const getDuty = (partialDuty = {}) => {
	const exampleDuty = {
		name: "Guard Duty",
		description: "Patrol the perimeter",
		location: {
			type: "Point",
			coordinates: [34.0522, -118.2437],
		},
		startTime: getDateByDaysOffset(1),
		endTime: getDateByDaysOffset(2),
		constraints: ["night duty", "outdoor duty"],
		soldiersRequired: 5,
		value: 5,
		minRank: 1,
		maxRank: 4,
		status: "unscheduled",
		statusHistory: [{ status: "unscheduled", date: new Date() }],
		soldiers: [],
		...partialDuty,
	};

	return exampleDuty;
};

export { getDuty, getDateByDaysOffset };

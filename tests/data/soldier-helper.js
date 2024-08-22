const getSoldier = (partialSoldier = {}) => {
	const exampleSoldier = {
		_id: "0000014",
		name: "meitav",
		rank: { value: 3 },
		limitations: ["limit1", "limit2"],
		...partialSoldier,
	};

	return exampleSoldier;
};

export { getSoldier };

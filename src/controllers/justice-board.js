import { generateJusticeBoard, getScore } from "../repositories/soldier.js";

const getJusticeBoard = async (request, reply) => {
	try {
		request.log.info("getting justice board");
		const justiceBoard = await generateJusticeBoard();

		if (justiceBoard.length === 0) {
			request.log.warn("no soldiers found so there is no justice board");
			return reply
				.code(404)
				.send({ message: "no soldiers found so there is no justice board" });
		}

		request.log.info("got the justice board: ", { justiceBoard });

		reply.code(200).send({ justiceBoard });
	} catch (err) {
		request.log.error("Error getting justice board: ", err);
		reply.code(500).send({ message: err.message });
	}
};

const getSoldierScore = async (request, reply) => {
	try {
		const { id } = request.params;

		request.log.info(`calculating the score of the soldier with the id: ${id}`);

		const { score } = { ...(await getScore(id)) };

		if (score === undefined) {
			request.log.warn(`soldier with the id ${id} not found`);
			return reply
				.code(404)
				.send({ message: `soldier with the id ${id} not found` });
		}

		request.log.info(`soldier: ${id} score is - ${score}`);

		reply.code(200).send({ score });
	} catch (err) {
		request.log.error("Error getting score by id: ", err);
		reply.code(500).send({ message: err.message });
	}
};

export { getJusticeBoard, getSoldierScore };

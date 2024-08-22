import { client } from "../mongo-connection.js";

const healthRoutes = async (fastify, options) => {
	fastify.get("/health", async (request, reply) => {
		reply.code(200).send({ status: "ok" });
	});
	fastify.get("/health/db", async (request, reply) => {
		const connected = await isConnected();
		if (connected) reply.code(200).send({ status: "ok" });

		reply.code(500).send({ message: "db not connected" });
	});

	const isConnected = async () => {
		try {
			await client.db("call-off-duty").command({ ping: 1 });

			return true;
		} catch (err) {
			fastify.log.error("Error pinging MongoDB server:", err);

			return false;
		}
	};
};

export default healthRoutes;

import Fastify from "fastify";
import { HttpStatusError } from "./errors/httpStatusError.js";
import { client } from "./mongo-connection.js";
import dutyRoutes from "./routes/duty.js";
import healthRoutes from "./routes/health.js";
import justiceBoardRoutes from "./routes/justice-board.js";
import soldierRoutes from "./routes/soldier.js";

export const buildServer = async () => {
	const server = Fastify({
		logger: { level: process.env.LOG_LEVEL || "info" },
	});

	server.setErrorHandler((error, request, reply) => {
		if (error instanceof HttpStatusError) {
			return reply.status(error.errorCode).send({ message: error.message });
		}

		reply.status(500).send({ message: error.message });
	});

	server.register(healthRoutes);
	server.register(soldierRoutes, { prefix: "soldiers" });
	server.register(dutyRoutes, { prefix: "duties" });
	server.register(justiceBoardRoutes, { prefix: "justice-board" });

	server.addHook("onClose", async (instance, done) => {
		try {
			await client.close();
			server.log.info("MongoDB connection closed");
			done();
		} catch (err) {
			server.log.error("Error closing MongoDB connection:", err);
			done(err);
		}
	});

	return server;
};

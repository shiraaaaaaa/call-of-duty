import {  buildApp } from "./app.js";

const startServer = async () => {
	const server = await buildApp();

	try {
		await server.listen({ port: process.env.PORT || 3000 });
		server.log.info(
			`Server is running on port ${server.server.address().port}`,
		);

		return server;
	} catch (err) {
		server.log.error(err);
		await server.close();
		process.exitCode = 1;
	}
};

export { startServer };

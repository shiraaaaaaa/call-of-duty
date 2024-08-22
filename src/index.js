import { scheduleAllDuties } from "./jobs/auto-schedule.js";
import { client } from "./mongo-connection.js";
import { startServer } from "./server.js";

let intervalId;

try {
	const server = await startServer();
	await client.connect();
	server.log.info("Connected to MongoDB");
	intervalId = setInterval(
		scheduleAllDuties,
		1000 * 60 * (process.env.AUTO_SCHEDULE_TIME_IN_MINUTES || 5),
	);
} catch (error) {
	console.error(error.message);
	client.close();
	clearInterval(intervalId);
}

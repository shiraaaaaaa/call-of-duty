import Fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { HttpStatusError } from './errors/httpStatusError.js';
import { client } from './mongo-connection.js';
import dutyRoutes from './routes/duty.js';
import healthRoutes from './routes/health.js';
import justiceBoardRoutes from './routes/justice-board.js';
import soldierRoutes from './routes/soldier.js';
import swaggerOptions from './routes/swagger.js';

export const buildApp = async () => {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL || 'info' },
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpStatusError) {
      return reply.status(error.errorCode).send({ message: error.message });
    }

    reply.status(500).send({ message: error.message });
  });

  app.register(healthRoutes);
  app.register(fastifySwagger, swaggerOptions);
  app.register(swaggerUi, {
    routePrefix: '/api-docs',
  });
  app.register(soldierRoutes, { prefix: 'soldiers' });
  app.register(dutyRoutes, { prefix: 'duties' });
  app.register(justiceBoardRoutes, { prefix: 'justice-board' });

  app.addHook('onClose', async (instance, done) => {
    try {
      await client.close();
      app.log.info('MongoDB connection closed');
      done();
    } catch (err) {
      app.log.error('Error closing MongoDB connection:', err);
      done(err);
    }
  });

  app.ready((err) => {
    if (err) throw err;
    app.swagger();
  });

  return app;
};

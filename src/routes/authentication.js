export const authenticate = async (request, reply) => {
  if (!request.headers.authorization || request.headers.authorization != process.env.API_KEY) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
};

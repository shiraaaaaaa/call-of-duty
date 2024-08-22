const swaggerOptions = {
  openapi: {
    info: {
      title: 'Call Of Duty',
      description: "Duties and soldiers' management API",
      version: '1.0.0',
    },
    externalDocs: {
      url: 'https://swagger.io',
      description: 'Find more info here',
    },
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'authorization',
          scheme: 'authorization',
        },
      },
    },
    security: [
      {
        ApiKeyAuth: [],
      },
    ],
  },
};

export default swaggerOptions;

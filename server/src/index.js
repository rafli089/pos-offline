import Fastify from 'fastify';
import { config } from './config.js';
import { store } from './store.js';
import { syncRoutes } from './sync/routes.js';
import { authRoutes } from './auth/routes.js';
import { menuRoutes } from './menus/routes.js';
import { shiftRoutes } from './shifts/routes.js';
import { paymentRoutes } from './payments/routes.js';
import { reportRoutes } from './reports/routes.js';

const app = Fastify({ logger: true, requestIdHeader: 'x-request-id', genReqId: () => crypto.randomUUID() });

app.decorate('store', store);

// Health check (PRD infrastructure requirement / fullstack-dev §13)
app.get('/health', async (req, reply) =>
  reply.send({ status: 'ok', timestamp: new Date().toISOString() }),
);

// ponytail: add /ready once DB check exists

app.register(authRoutes, { prefix: '/api/auth' });
app.register(menuRoutes, { prefix: '/api/menu' });
app.register(shiftRoutes, { prefix: '/api/shifts' });
app.register(paymentRoutes, { prefix: '/api/payments' });
app.register(syncRoutes, { prefix: '/api/sync' });
app.register(reportRoutes, { prefix: '/api/reports' });

// CORS — dev uses '*'; production: explicit origins (fullstack-dev §13)
app.addHook('onRequest', (req, reply, done) => {
  const origin = req.headers.origin;
  if (origin && config.cors.origins.includes(origin)) {
    reply.header('Access-Control-Allow-Origin', origin);
    reply.header('Access-Control-Allow-Credentials', 'true');
    reply.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (req.method === 'OPTIONS') {
    reply.code(204).send();
    return;
  }
  done();
});

// Global error handler — typed, never leaks stack (fullstack-dev §3)
app.setErrorHandler((err, req, reply) => {
  const status = err.statusCode || 500;
  if (status >= 500) app.log.error(err, { request_id: req.id });
  else app.log.warn(err, { request_id: req.id });
  reply.code(status).send({
    title: err.code || 'INTERNAL_ERROR',
    status,
    detail: status >= 500 ? 'Internal error' : err.message,
    request_id: req.id,
  });
});

// Graceful shutdown (fullstack-dev §13)
const signals = ['SIGINT', 'SIGTERM'];
for (const sig of signals) {
  process.on(sig, async () => {
    app.log.info(`${sig} received — shutting down`);
    await app.close();
    process.exit(0);
  });
}

const start = async () => {
  try {
    const addr = await app.listen({ port: config.port, host: config.host });
    console.log('POS API server ready:', addr);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
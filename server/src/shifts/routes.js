/**
 * Shift endpoints — PRD §7
 * POST /api/shifts/start
 * POST /api/shifts/close
 */
import { store, nextSeq } from '../store.js';

export function shiftRoutes(fastify, opts) {
  fastify.post('/start', async (req, reply) => {
    const { branchId, userId, terminalId, stationId, startingCash } = req.body;
    if (!businessDayOpen(branchId, fastify)) {
      return reply.code(400).send({ error: 'Business day not open' });
    }
    const shift = {
      id: 'shift-' + Date.now(),
      businessDayId: getOpenDay(branchId, fastify),
      branchId,
      userId,
      stationId,
      terminalId,
      status: 'OPEN',
      startingCash: startingCash,
      expectedCash: startingCash,
      actualCash: 0,
      variance: 0,
      varianceStatus: 'BALANCED',
      cashSales: 0,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    fastify.store.shifts.set(shift.id, shift);
    reply.code(201).send(shift);
  });

  fastify.post('/close', async (req, reply) => {
    const { shiftId, actualCash } = req.body;
    const shift = fastify.store.shifts.get(shiftId);
    if (!shift || shift.status !== 'OPEN') {
      return reply.code(400).send({ error: 'Shift not open' });
    }
    const expected = shift.expectedCash;
    const variance = actualCash - expected;
    const status = variance === 0 ? 'BALANCED' : variance < 0 ? 'SHORT' : 'OVER';
    shift.status = 'CLOSED';
    shift.actualCash = actualCash;
    shift.variance = variance;
    shift.varianceStatus = status;
    shift.closedAt = new Date().toISOString();
    fastify.store.shifts.set(shiftId, shift);
    reply.send({ shift, variance, status });
  });

  fastify.get('/open', async (req, reply) => {
    // Get open shift for current user
    const sessionId = req.headers['x-session-id'] || req.query.sessionId;
    const shift = [...fastify.store.shifts.values()].find(s => s.userId === sessionId && s.status === 'OPEN');
    reply.send(shift || null);
  });
}

function businessDayOpen(branchId, fastify) {
  const day = [...fastify.store.businessDays.values()].find(d => d.branchId === branchId && d.status === 'OPEN');
  return !!day;
}

function getOpenDay(branchId, fastify) {
  const day = [...fastify.store.businessDays.values()].find(d => d.branchId === branchId && d.status === 'OPEN');
  return day?.id;
}
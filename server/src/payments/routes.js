/** Payment endpoints — PRD §10 */
export function paymentRoutes(fastify, opts) {
  fastify.post('/complete', async (req, reply) => {
    const { transactionId, payments } = req.body;
    // Multiple payment support (PRD 10)
    const total = payments.reduce((s, p) => s + p.amount_cents, 0);
    reply.code(201);
    return { transactionId, total, payments };
  });

  fastify.get('/:id', async (req, reply) => {
    const id = req.params.id;
    reply.send({ id, status: 'PAID' });
  });
}

export default paymentRoutes;
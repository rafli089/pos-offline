/** Sales report endpoints — PRD §13 */
export function reportRoutes(fastify, opts) {
  fastify.get('/sales', async (req, reply) => {
    const { date, branchId } = req.query;
    // ponytail: query PostgreSQL with Drizzle when DB ready
    return {
      date,
      branchId,
      total_sales_cents: 0,
      transaction_count: 0,
      items: [],
    };
  });

  fastify.get('/payment', async (req, reply) => {
    return { methods: [] };
  });

  fastify.get('/cashier', async (req, reply) => {
    return { cashiers: [] };
  });
}

export default reportRoutes;
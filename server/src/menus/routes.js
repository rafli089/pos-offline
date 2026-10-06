/** Menu endpoints — PRD §9 */
export function menuRoutes(fastify, opts) {
  fastify.get('/', async (req, reply) => {
    // PRD 9 — returns all active menus with availability; client caches for offline
    const menus = [...fastify.store.menus.values()];
    if (menus.length === 0) {
      // bootstrap demo data on first request
      const seed = [
        { id: 'cat-001', name: 'Coffee', display_order: 1 },
        { id: 'cat-002', name: 'Non Coffee', display_order: 2 },
        { id: 'cat-003', name: 'Food', display_order: 3 },
      ];
      seed.forEach(c => fastify.store.menuCategories.set(c.id, c));
      const items = [
        { id: 'menu-001', name: 'Espresso', sku: 'ESP-001', category_id: 'cat-001', price_cents: 1500000, availability: 'AVAILABLE', display_order: 1 },
        { id: 'menu-002', name: 'Latte', sku: 'LAT-001', category_id: 'cat-001', price_cents: 1800000, availability: 'AVAILABLE', display_order: 2 },
        { id: 'menu-003', name: 'Americano', sku: 'AME-001', category_id: 'cat-001', price_cents: 1200000, availability: 'AVAILABLE', display_order: 3 },
        { id: 'menu-005', name: 'Matcha Latte', sku: 'MAT-001', category_id: 'cat-002', price_cents: 2000000, availability: 'AVAILABLE', display_order: 1 },
        { id: 'menu-006', name: 'Croissant', sku: 'CRO-001', category_id: 'cat-003', price_cents: 1800000, availability: 'AVAILABLE', display_order: 1 },
      ];
      items.forEach(m => fastify.store.menus.set(m.id, m));
      return { categories: seed, menus: items };
    }
    return {
      categories: [...fastify.store.menuCategories.values()],
      menus: menus,
    };
  });

  fastify.post('/', async (req, reply) => {
    const body = req.body;
    const id = 'menu-' + Date.now();
    const m = { id, ...body };
    fastify.store.menus.set(id, m);
    reply.code(201).send(m);
  });
}

export default menuRoutes;
import { db } from './db';
import mockData from './mockData';

export async function seedDatabase() {
  const menuCount = await db.menus.count();
  if (menuCount > 0) return; // sudah pernah seed

  await db.transaction('rw', db.menus, db.categories, db.modifiers, db.extras, async () => {
    for (const cat of mockData.categories) {
      await db.categories.put(cat);
    }
    for (const menu of mockData.menus) {
      await db.menus.put(menu as any);
    }
    for (const mod of mockData.modifiers) {
      await db.modifiers.put(mod);
    }
    for (const ext of mockData.extras) {
      await db.extras.put(ext as any);
    }
  });
}

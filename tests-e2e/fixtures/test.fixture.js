import { test as base, expect } from '@playwright/test';
import { MateriasPrimasPage } from '../pages/MateriasPrimasPage.js';
import { ProductosPage } from '../pages/ProductosPage.js';
import { ProduccionPage } from '../pages/ProduccionPage.js';
import { DistribucionPage } from '../pages/DistribucionPage.js';
import { DashboardPage } from '../pages/DashboardPage.js';

/**
 * Fixtures personalizadas de Playwright: inyectan los Page Objects ya instanciados
 * en cada caso de prueba sin necesidad de repetir `new ...Page(page)`.
 */
export const test = base.extend({
  mpPage: async ({ page }, use) => {
    await use(new MateriasPrimasPage(page));
  },
  productosPage: async ({ page }, use) => {
    await use(new ProductosPage(page));
  },
  produccionPage: async ({ page }, use) => {
    await use(new ProduccionPage(page));
  },
  distribucionPage: async ({ page }, use) => {
    await use(new DistribucionPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  }
});

export { expect };

import { BasePage } from './BasePage.js';

export class DashboardPage extends BasePage {
  constructor(page) {
    super(page, '/');
    this.alertaMateriaPanel = page.locator('.panel', { hasText: 'Alerta Materia Prima' });
  }
}

export class DashboardPage {
  constructor(page) {
    this.page = page;
    this.alertaMateriaPanel = page.locator('.panel', { hasText: 'Alerta Materia Prima' });
  }

  async goto() {
    await this.page.goto('/');
  }
}

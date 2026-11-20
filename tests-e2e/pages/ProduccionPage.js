import { BasePage } from './BasePage.js';

export class ProduccionPage extends BasePage {
  constructor(page) {
    super(page, '/produccion');
    this.productoSelect = page.locator('form select');
    this.cantidadInput = page.locator('form input[type="number"]');
    this.observacionInput = page.locator('form input[placeholder*="Lote"]');
    this.submitBtn = page.getByRole('button', { name: 'Registrar Produccion' });
    this.errorBanner = page.locator('.error-msg');
    this.firstRow = page.locator('table tbody tr').first();
  }

  async registrarProduccion(productoNombre, cantidad, observacion) {
    await this.productoSelect.selectOption({ label: productoNombre });
    await this.fill(this.cantidadInput, cantidad);
    if (observacion) {
      await this.fill(this.observacionInput, observacion);
    }

    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/produccion') && res.request().method() === 'POST'
    );
    await this.click(this.submitBtn);
    return await respPromise;
  }

  async intentarEnviarCantidadInvalida(productoNombre, cantidad) {
    await this.productoSelect.selectOption({ label: productoNombre });
    await this.fill(this.cantidadInput, cantidad);

    let apiCalled = false;
    this.page.on('request', (req) => {
      if (req.url().includes('/api/produccion') && req.method() === 'POST') {
        apiCalled = true;
      }
    });

    await this.click(this.submitBtn);
    const isHtml5Valid = await this.cantidadInput.evaluate((el) => el.checkValidity());
    const validationMessage = await this.cantidadInput.evaluate((el) => el.validationMessage);
    return { isHtml5Valid, validationMessage, apiCalled };
  }
}

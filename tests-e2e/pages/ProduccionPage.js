export class ProduccionPage {
  constructor(page) {
    this.page = page;
    this.productoSelect = page.locator('form select');
    this.cantidadInput = page.locator('form input[type="number"]');
    this.observacionInput = page.locator('form input[placeholder*="Lote"]');
    this.submitBtn = page.getByRole('button', { name: 'Registrar Produccion' });
    this.errorBanner = page.locator('.error-msg');
    this.firstRow = page.locator('table tbody tr').first();
  }

  async goto() {
    await this.page.goto('/produccion');
  }

  async registrarProduccion(productoNombre, cantidad, observacion) {
    await this.productoSelect.selectOption({ label: productoNombre });
    await this.cantidadInput.fill(String(cantidad));
    if (observacion) {
      await this.observacionInput.fill(observacion);
    }

    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/produccion') && res.request().method() === 'POST'
    );
    await this.submitBtn.click();
    return await respPromise;
  }

  async intentarEnviarCantidadInvalida(productoNombre, cantidad) {
    await this.productoSelect.selectOption({ label: productoNombre });
    await this.cantidadInput.fill(String(cantidad));

    let apiCalled = false;
    this.page.on('request', (req) => {
      if (req.url().includes('/api/produccion') && req.method() === 'POST') {
        apiCalled = true;
      }
    });

    await this.submitBtn.click();
    const isHtml5Valid = await this.cantidadInput.evaluate((el) => el.checkValidity());
    return { isHtml5Valid, apiCalled };
  }
}

import { BasePage } from './BasePage.js';

export class DistribucionPage extends BasePage {
  constructor(page) {
    super(page, '/distribucion');
    this.productoSelect = page.locator('form select').nth(0);
    this.sedeSelect = page.locator('form select').nth(1);
    this.cantidadInput = page.locator('form input[type="number"]');
    this.referenciaInput = page.locator('form input[placeholder="Referencia"]');
    this.distribuirBtn = page.getByRole('button', { name: 'Distribuir' });
    this.errorBanner = page.locator('.error-msg');
  }

  async llenarFormulario(producto, sede, cantidad, referencia) {
    await this.productoSelect.selectOption({ label: producto });
    await this.sedeSelect.selectOption({ label: sede });
    await this.fill(this.cantidadInput, cantidad);
    await this.fill(this.referenciaInput, referencia);
  }

  async distribuir(producto, sede, cantidad, referencia) {
    await this.llenarFormulario(producto, sede, cantidad, referencia);
    const respPromise = this.page.waitForResponse(
      (res) => res.url().includes('/api/inventario/distribuciones') && res.request().method() === 'POST'
    );
    await this.click(this.distribuirBtn);
    return await respPromise;
  }

  async intentarDistribuirInvalido(producto, sede, cantidad, referencia) {
    await this.llenarFormulario(producto, sede, cantidad, referencia);

    let apiCalled = false;
    this.page.on('request', (req) => {
      if (req.url().includes('/api/inventario/distribuciones')) {
        apiCalled = true;
      }
    });

    await this.click(this.distribuirBtn);
    const isHtml5Valid = await this.cantidadInput.evaluate((el) => el.checkValidity());
    return { isHtml5Valid, apiCalled };
  }
}

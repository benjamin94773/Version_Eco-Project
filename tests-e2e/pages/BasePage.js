export class BasePage {
  constructor(page, path = '/') {
    this.page = page;
    this.path = path;
  }

  async goto() {
    await this.page.goto(this.path);
  }

  async fill(locator, value) {
    await locator.waitFor({ state: 'visible' });
    await locator.fill(String(value));
  }

  async click(locator) {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }
}

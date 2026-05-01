import { test, expect, type Page } from "@playwright/test";

function activePage(page: Page) {
  return page.locator(".taro_page_show:not(.taro_page_shade)");
}

async function loginAsGuide(page: Page) {
  await page.goto("/");
  await expect(activePage(page).locator(".brand-title")).toBeVisible({
    timeout: 10000,
  });
  await page.locator('input[placeholder="请输入手机号"]').fill("13800001111");
  await activePage(page).locator("taro-button-core.btn-primary").click();
  await expect(activePage(page).locator(".welcome")).toContainText("李导游", {
    timeout: 10000,
  });
}

/** Navigate from guide home to tour detail page for the given tour code. */
async function goToTourDetail(page: Page, tourCode: string) {
  await activePage(page)
    .locator(".tour-card")
    .filter({ hasText: tourCode })
    .click();
  // Wait for the detail page: it has a ".actions" section (unique to tour detail)
  // and the white slip section label.
  await page.waitForURL(/pages\/tour\/detail/, { timeout: 10000 });
  await expect(
    activePage(page).locator("taro-button-core.btn-primary")
  ).toBeVisible({ timeout: 10000 });
}

/** From tour detail, open the white slip editor. */
async function openWhiteSlipEditor(page: Page) {
  await activePage(page).locator("taro-button-core.btn-primary").click();
  await expect(activePage(page).getByText("白单编辑")).toBeVisible({
    timeout: 10000,
  });
}

test.describe("Guide complete flow", () => {
  test("login as guide and see tours list", async ({ page }) => {
    await loginAsGuide(page);
    await expect(activePage(page).locator(".section-title")).toContainText(
      "我的团次"
    );
    await expect(activePage(page).locator(".tour-card")).toHaveCount(3);
  });

  test("create a new tour", async ({ page }) => {
    await loginAsGuide(page);
    await activePage(page).locator("taro-button-core.btn-create").click();

    // Tour create form
    await expect(activePage(page).locator(".label").first()).toBeVisible({
      timeout: 10000,
    });

    const tourCodeInput = activePage(page).locator("input").first();
    const defaultCode = await tourCodeInput.inputValue();
    expect(defaultCode).toMatch(/^GL\d{8}-\d{2}$/);

    // Red slip selector visible (use exact match for the label)
    await expect(
      activePage(page).locator(".label").filter({ hasText: "选择红单" })
    ).toBeVisible();

    // Submit
    await activePage(page).locator("taro-button-core.btn-submit").click();
    // Should redirect to tour detail showing the new tour code
    await expect(activePage(page).locator(".tour-code")).toContainText(
      defaultCode.substring(0, 10),
      { timeout: 10000 }
    );
  });

  test("navigate to tour detail and see white slip section", async ({
    page,
  }) => {
    await loginAsGuide(page);
    await goToTourDetail(page, "GL20250421-01");
    await expect(activePage(page).getByText("白单概况")).toBeVisible();
  });

  test("open white slip editor from tour detail", async ({ page }) => {
    await loginAsGuide(page);
    await goToTourDetail(page, "GL20250421-01");
    await openWhiteSlipEditor(page);
    await expect(activePage(page).getByText("默认送货地址")).toBeVisible();
  });

  test("white slip editor shows products and guest entries", async ({
    page,
  }) => {
    await loginAsGuide(page);
    await goToTourDetail(page, "GL20250421-01");
    await openWhiteSlipEditor(page);

    // Red slip name
    await expect(activePage(page).getByText("特产精选套餐")).toBeVisible();
    // Guest cards
    const guestCards = activePage(page).locator(".guest-card");
    expect(await guestCards.count()).toBeGreaterThanOrEqual(2);
  });

  test("add guest entry in white slip editor", async ({ page }) => {
    await loginAsGuide(page);
    await goToTourDetail(page, "GL20250421-01");
    await openWhiteSlipEditor(page);

    const initialCount = await activePage(page).locator(".guest-card").count();
    await activePage(page).locator(".add-guest-btn").click();
    const newCount = await activePage(page).locator(".guest-card").count();
    expect(newCount).toBe(initialCount + 1);
  });

  test("edit guest number", async ({ page }) => {
    await loginAsGuide(page);
    await goToTourDetail(page, "GL20250421-01");
    await openWhiteSlipEditor(page);

    // Edit the first guest's number -- Taro wraps inputs in taro-input-core,
    // so target the inner <input> element directly.
    const guestInput = activePage(page)
      .locator(".guest-no-input input")
      .first();
    await guestInput.clear();
    await guestInput.fill("099");
    expect(await guestInput.inputValue()).toBe("099");
  });

  test("add custom product to a guest entry", async ({ page }) => {
    await loginAsGuide(page);
    await goToTourDetail(page, "GL20250421-01");
    await openWhiteSlipEditor(page);

    await activePage(page).locator(".custom-add-btn").first().click();
    await expect(
      activePage(page).locator('input[placeholder="商品名称"]').first()
    ).toBeVisible();
  });

  test("change delivery method in white slip editor", async ({ page }) => {
    await loginAsGuide(page);
    await goToTourDetail(page, "GL20250421-01");
    await openWhiteSlipEditor(page);

    // Switch first guest to express
    await activePage(page)
      .locator(".delivery-option")
      .filter({ hasText: "快递到家" })
      .first()
      .click();
    await expect(
      activePage(page)
        .locator('input[placeholder="请输入快递收货地址"]')
        .first()
    ).toBeVisible();
  });

  test("save white slip", async ({ page }) => {
    await loginAsGuide(page);
    await goToTourDetail(page, "GL20250421-01");
    await openWhiteSlipEditor(page);

    await activePage(page).locator(".btn-save").click();
    // Should navigate back to tour detail
    await expect(activePage(page).locator(".tour-code")).toContainText(
      "GL20250421-01",
      { timeout: 10000 }
    );
  });

  test("view summary table from tour detail", async ({ page }) => {
    await loginAsGuide(page);
    await goToTourDetail(page, "GL20250420-01");

    const summaryBtn = activePage(page).locator("taro-button-core.btn-outline");
    if (await summaryBtn.isVisible()) {
      await summaryBtn.click();
      // Wait for the summary page to load (unique element)
      await expect(
        activePage(page).locator(".summary-brand")
      ).toBeVisible({ timeout: 10000 });
      await expect(
        activePage(page).locator(".table-footer").getByText("合计")
      ).toBeVisible();
    }
  });

  test("submit to supplier shows confirmation screen", async ({ page }) => {
    await loginAsGuide(page);
    await goToTourDetail(page, "GL20250421-01");

    const submitBtn = activePage(page).locator("taro-button-core.btn-submit");
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await expect(
        activePage(page).getByText("确认提交给供货商")
      ).toBeVisible({ timeout: 5000 });
      await expect(
        activePage(page).getByText("确认提交", { exact: true })
      ).toBeVisible();
    }
  });
});

import { test, expect, type Page } from "@playwright/test";

function activePage(page: Page) {
  return page.locator(".taro_page_show:not(.taro_page_shade)");
}

async function loginAsSupplier(page: Page) {
  await page.goto("/");
  await expect(activePage(page).locator(".brand-title")).toBeVisible({
    timeout: 10000,
  });
  await page.locator('input[placeholder="请输入手机号"]').fill("13800002222");
  await activePage(page).locator("taro-button-core.btn-primary").click();
  await expect(
    activePage(page).locator(".tab").filter({ hasText: "待确认" })
  ).toBeVisible({ timeout: 10000 });
}

/** Navigate to the order detail from confirmed tab. */
async function goToConfirmedOrderDetail(page: Page) {
  await activePage(page).locator(".tab").filter({ hasText: "待发货" }).click();
  await expect(activePage(page).getByText("GL20250420-01")).toBeVisible({
    timeout: 10000,
  });
  await activePage(page)
    .locator(".order-card")
    .filter({ hasText: "GL20250420-01" })
    .click();
  await expect(activePage(page).getByText("团次信息")).toBeVisible({
    timeout: 10000,
  });
}

test.describe("Supplier flow", () => {
  test("login as supplier and see orders page", async ({ page }) => {
    await loginAsSupplier(page);
    await expect(
      activePage(page).locator(".tab").filter({ hasText: "待确认" })
    ).toBeVisible();
    await expect(
      activePage(page).locator(".tab").filter({ hasText: "待发货" })
    ).toBeVisible();
    await expect(
      activePage(page).locator(".tab").filter({ hasText: "已发货" })
    ).toBeVisible();
    await expect(
      activePage(page).locator(".tab").filter({ hasText: "已完成" })
    ).toBeVisible();
    await expect(activePage(page).locator(".welcome")).toContainText(
      "桂林特产王"
    );
  });

  test("view orders list under confirmed tab", async ({ page }) => {
    await loginAsSupplier(page);
    await activePage(page).locator(".tab").filter({ hasText: "待发货" }).click();
    await expect(activePage(page).getByText("GL20250420-01")).toBeVisible({
      timeout: 10000,
    });
  });

  test("switch between status tabs", async ({ page }) => {
    await loginAsSupplier(page);

    await activePage(page).locator(".tab").filter({ hasText: "已完成" }).click();
    await expect(activePage(page).getByText("GL20250418-01")).toBeVisible({
      timeout: 10000,
    });

    await activePage(page).locator(".tab").filter({ hasText: "待确认" }).click();
    await page.waitForTimeout(500);
    await expect(
      activePage(page).locator(".tab.active").filter({ hasText: "待确认" })
    ).toBeVisible();
  });

  test("open order detail from list", async ({ page }) => {
    await loginAsSupplier(page);
    await goToConfirmedOrderDetail(page);
    await expect(activePage(page).getByText("团号")).toBeVisible();
  });

  test("see guide info in order detail", async ({ page }) => {
    await loginAsSupplier(page);
    await goToConfirmedOrderDetail(page);

    await expect(activePage(page).getByText("导游信息")).toBeVisible();
    // "李导游" appears in both "导游：李导游" (order list) and guide info card
    await expect(
      activePage(page).getByText("李导游", { exact: true })
    ).toBeVisible();
    await expect(activePage(page).getByText("13800001111")).toBeVisible();
  });

  test("see white slip details section", async ({ page }) => {
    await loginAsSupplier(page);
    await goToConfirmedOrderDetail(page);

    // White slip section header is always visible
    await expect(activePage(page).getByText("白单明细")).toBeVisible();
    // Total line is always shown
    await expect(activePage(page).getByText("合计")).toBeVisible();
  });

  test("add a note/comment on order detail", async ({ page }) => {
    await loginAsSupplier(page);
    await goToConfirmedOrderDetail(page);

    await expect(activePage(page).getByText("备注留言")).toBeVisible();
    await activePage(page)
      .locator('input[placeholder="输入备注..."]')
      .fill("测试备注消息");
    await activePage(page).locator(".btn-send").click();
    await expect(activePage(page).getByText("测试备注消息")).toBeVisible({
      timeout: 5000,
    });
  });
});

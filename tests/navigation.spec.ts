import { test, expect } from "@playwright/test";

test.describe("页面路由", () => {
  test("首页路由可访问", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("创建团次页可访问", async ({ page }) => {
    const response = await page.goto("/#/pages/tour/create/index");
    expect(response?.status()).toBe(200);
  });

  test("供货商订单页可访问", async ({ page }) => {
    const response = await page.goto("/#/pages/supplier/orders/index");
    expect(response?.status()).toBe(200);
  });

  test("统计页可访问", async ({ page }) => {
    const response = await page.goto("/#/pages/stats/index");
    expect(response?.status()).toBe(200);
  });

  test("配送地址修改页可访问", async ({ page }) => {
    const response = await page.goto("/#/pages/delivery/index");
    expect(response?.status()).toBe(200);
  });

  test("填写白单页可访问", async ({ page }) => {
    const response = await page.goto("/#/pages/order/create/index");
    expect(response?.status()).toBe(200);
  });
});

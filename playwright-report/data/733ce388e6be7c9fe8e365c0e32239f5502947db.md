# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: stats.spec.ts >> 数据统计 >> 日期筛选Tab可切换
- Location: tests/stats.spec.ts:17:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=本月')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e6]:
    - generic [ref=e7]:
      - generic [ref=e8]: 桂礼道
      - generic [ref=e9]: 旅游特产销售管理
    - generic [ref=e10]:
      - generic [ref=e11]: 请选择您的身份
      - generic [ref=e12]: 我是导游
      - generic [ref=e13]: 我是供货商
  - generic [ref=e15]:
    - link "首页" [ref=e16] [cursor=pointer]:
      - /url: javascript:;
      - paragraph [ref=e18]: 首页
    - link "订单" [ref=e19] [cursor=pointer]:
      - /url: javascript:;
      - paragraph [ref=e21]: 订单
    - link "统计" [ref=e22] [cursor=pointer]:
      - /url: javascript:;
      - paragraph [ref=e24]: 统计
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("数据统计", () => {
  4  |   test("页面加载成功", async ({ page }) => {
  5  |     await page.goto("/pages/stats/index");
  6  |     await expect(page).toHaveTitle(/桂礼道/);
  7  |   });
  8  | 
  9  |   test("显示日期筛选Tab", async ({ page }) => {
  10 |     await page.goto("/pages/stats/index");
  11 |     await expect(page.locator("text=今天")).toBeVisible();
  12 |     await expect(page.locator("text=本周")).toBeVisible();
  13 |     await expect(page.locator("text=本月")).toBeVisible();
  14 |     await expect(page.locator("text=全部")).toBeVisible();
  15 |   });
  16 | 
  17 |   test("日期筛选Tab可切换", async ({ page }) => {
  18 |     await page.goto("/pages/stats/index");
> 19 |     await page.locator("text=本月").click();
     |                                   ^ Error: locator.click: Test timeout of 30000ms exceeded.
  20 |     await expect(page.locator("text=本月")).toBeVisible();
  21 |   });
  22 | 
  23 |   test("显示统计概览", async ({ page }) => {
  24 |     await page.goto("/pages/stats/index");
  25 |     await expect(page.locator("text=总订单")).toBeVisible();
  26 |     await expect(page.locator("text=总金额")).toBeVisible();
  27 |   });
  28 | });
  29 | 
```
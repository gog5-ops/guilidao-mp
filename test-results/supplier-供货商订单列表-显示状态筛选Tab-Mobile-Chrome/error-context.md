# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: supplier.spec.ts >> 供货商订单列表 >> 显示状态筛选Tab
- Location: tests/supplier.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=待确认')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=待确认')

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
  3  | test.describe("供货商订单列表", () => {
  4  |   test("页面加载成功", async ({ page }) => {
  5  |     await page.goto("/pages/supplier/orders/index");
  6  |     await expect(page).toHaveTitle(/桂礼道/);
  7  |   });
  8  | 
  9  |   test("显示状态筛选Tab", async ({ page }) => {
  10 |     await page.goto("/pages/supplier/orders/index");
> 11 |     await expect(page.locator("text=待确认")).toBeVisible();
     |                                            ^ Error: expect(locator).toBeVisible() failed
  12 |     await expect(page.locator("text=待发货")).toBeVisible();
  13 |     await expect(page.locator("text=已发货")).toBeVisible();
  14 |     await expect(page.locator("text=已完成")).toBeVisible();
  15 |   });
  16 | 
  17 |   test("Tab 切换可点击", async ({ page }) => {
  18 |     await page.goto("/pages/supplier/orders/index");
  19 |     const tab = page.locator("text=待发货");
  20 |     await tab.click();
  21 |     await expect(tab).toBeVisible();
  22 |   });
  23 | });
  24 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: delivery.spec.ts >> 配送地址修改 >> 配送方式可切换
- Location: tests/delivery.spec.ts:16:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=快递到家')

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
  3  | test.describe("配送地址修改", () => {
  4  |   test("页面加载成功", async ({ page }) => {
  5  |     await page.goto("/pages/delivery/index");
  6  |     await expect(page).toHaveTitle(/桂礼道/);
  7  |   });
  8  | 
  9  |   test("显示三种配送方式", async ({ page }) => {
  10 |     await page.goto("/pages/delivery/index");
  11 |     await expect(page.locator("text=酒店送货")).toBeVisible();
  12 |     await expect(page.locator("text=景点自提")).toBeVisible();
  13 |     await expect(page.locator("text=快递到家")).toBeVisible();
  14 |   });
  15 | 
  16 |   test("配送方式可切换", async ({ page }) => {
  17 |     await page.goto("/pages/delivery/index");
> 18 |     await page.locator("text=快递到家").click();
     |                                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
  19 |     await expect(page.locator("text=收货地址")).toBeVisible();
  20 |   });
  21 | 
  22 |   test("显示保存按钮", async ({ page }) => {
  23 |     await page.goto("/pages/delivery/index");
  24 |     await expect(page.locator("text=保存修改")).toBeVisible();
  25 |   });
  26 | 
  27 |   test("显示送达时间输入", async ({ page }) => {
  28 |     await page.goto("/pages/delivery/index");
  29 |     await expect(page.locator("text=期望送达时间")).toBeVisible();
  30 |   });
  31 | });
  32 | 
```
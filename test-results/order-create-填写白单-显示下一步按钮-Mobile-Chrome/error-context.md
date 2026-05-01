# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: order-create.spec.ts >> 填写白单 >> 显示下一步按钮
- Location: tests/order-create.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=下一步')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=下一步')

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
  3  | test.describe("填写白单", () => {
  4  |   test("页面显示商品选择标题", async ({ page }) => {
  5  |     await page.goto("/pages/order/create/index");
  6  |     await expect(page.locator("text=选择商品和数量")).toBeVisible();
  7  |   });
  8  | 
  9  |   test("显示下一步按钮", async ({ page }) => {
  10 |     await page.goto("/pages/order/create/index");
> 11 |     await expect(page.locator("text=下一步")).toBeVisible();
     |                                            ^ Error: expect(locator).toBeVisible() failed
  12 |   });
  13 | 
  14 |   test("显示合计信息", async ({ page }) => {
  15 |     await page.goto("/pages/order/create/index");
  16 |     await expect(page.locator("text=合计")).toBeVisible();
  17 |   });
  18 | });
  19 | 
```
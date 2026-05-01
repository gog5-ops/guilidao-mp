# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tour-create.spec.ts >> 创建团次 >> 日期选择器显示今天日期
- Location: tests/tour-create.spec.ts:18:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=2026-05-01')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=2026-05-01')

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
  3  | test.describe("创建团次", () => {
  4  |   test("页面显示表单元素", async ({ page }) => {
  5  |     await page.goto("/pages/tour/create/index");
  6  |     await expect(page.locator("text=团号")).toBeVisible();
  7  |     await expect(page.locator("text=出团日期")).toBeVisible();
  8  |     await expect(page.locator("text=创建团次")).toBeVisible();
  9  |   });
  10 | 
  11 |   test("团号输入框有默认值", async ({ page }) => {
  12 |     await page.goto("/pages/tour/create/index");
  13 |     const input = page.locator("input").first();
  14 |     const value = await input.inputValue();
  15 |     expect(value).toMatch(/^GL\d{8}-\d{2}$/);
  16 |   });
  17 | 
  18 |   test("日期选择器显示今天日期", async ({ page }) => {
  19 |     await page.goto("/pages/tour/create/index");
  20 |     const today = new Date().toISOString().slice(0, 10);
> 21 |     await expect(page.locator(`text=${today}`)).toBeVisible();
     |                                                 ^ Error: expect(locator).toBeVisible() failed
  22 |   });
  23 | });
  24 | 
```
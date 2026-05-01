# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> 首页 >> 显示品牌名称
- Location: tests/home.spec.ts:9:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=桂礼道')
Expected: visible
Error: strict mode violation: locator('text=桂礼道') resolved to 2 elements:
    1) <div class="taro-navigation-bar-title">桂礼道</div> aka locator('#taro-navigation-bar').getByText('桂礼道')
    2) <taro-text-core class="brand-title">…</taro-text-core> aka locator('#app').getByText('桂礼道')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=桂礼道')

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
  3  | test.describe("首页", () => {
  4  |   test("页面加载成功", async ({ page }) => {
  5  |     await page.goto("/");
  6  |     await expect(page).toHaveTitle(/桂礼道/);
  7  |   });
  8  | 
  9  |   test("显示品牌名称", async ({ page }) => {
  10 |     await page.goto("/");
> 11 |     await expect(page.locator("text=桂礼道")).toBeVisible();
     |                                            ^ Error: expect(locator).toBeVisible() failed
  12 |   });
  13 | 
  14 |   test("显示角色选择按钮", async ({ page }) => {
  15 |     await page.goto("/");
  16 |     await expect(page.locator("text=我是导游")).toBeVisible();
  17 |     await expect(page.locator("text=我是供货商")).toBeVisible();
  18 |   });
  19 | 
  20 |   test("显示身份选择提示", async ({ page }) => {
  21 |     await page.goto("/");
  22 |     await expect(page.locator("text=请选择您的身份")).toBeVisible();
  23 |   });
  24 | });
  25 | 
```
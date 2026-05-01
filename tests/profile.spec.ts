import { test, expect, type Page } from "@playwright/test";

function activePage(page: Page) {
  return page.locator(".taro_page_show:not(.taro_page_shade)");
}

async function loginAndGoToProfile(page: Page) {
  await page.goto("/");
  await expect(activePage(page).locator(".brand-title")).toBeVisible({
    timeout: 10000,
  });
  await page.locator('input[placeholder="请输入手机号"]').fill("13800001111");
  await activePage(page).locator("taro-button-core.btn-primary").click();
  await expect(activePage(page).locator(".welcome")).toContainText("李导游", {
    timeout: 10000,
  });

  // Navigate to profile via welcome link
  await activePage(page).locator(".welcome").click();
  await expect(
    activePage(page).locator("taro-button-core.btn-save")
  ).toBeVisible({ timeout: 10000 });
}

test.describe("Profile page", () => {
  test("view profile shows user info", async ({ page }) => {
    await loginAndGoToProfile(page);

    await expect(activePage(page).getByText("姓名")).toBeVisible();
    await expect(activePage(page).getByText("手机号")).toBeVisible();
    await expect(activePage(page).getByText("微信号")).toBeVisible();
    await expect(activePage(page).getByText("注册时间")).toBeVisible();
    await expect(activePage(page).locator(".role-badge")).toContainText("导游");
  });

  test("profile page shows avatar with first character", async ({ page }) => {
    await loginAndGoToProfile(page);
    const avatar = activePage(page).locator(".avatar");
    await expect(avatar).toBeVisible();
    const avatarText = await avatar.textContent();
    expect(avatarText?.trim()).toBe("李");
  });

  test("edit name and save", async ({ page }) => {
    await loginAndGoToProfile(page);

    const nameInput = activePage(page).locator('input[placeholder="输入姓名"]');
    await nameInput.clear();
    await nameInput.fill("李导游更新");

    await activePage(page).locator("taro-button-core.btn-save").click();
    await expect(
      page.locator(".taro__toast p").filter({ hasText: "保存成功" })
    ).toBeVisible({ timeout: 5000 });
  });

  test("logout from profile page", async ({ page }) => {
    await loginAndGoToProfile(page);

    await activePage(page).locator("taro-button-core.btn-logout").click();
    // reLaunch back to index
    await expect(activePage(page).locator(".brand-title")).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator('input[placeholder="请输入手机号"]')
    ).toBeVisible();
  });

  test("save button is enabled", async ({ page }) => {
    await loginAndGoToProfile(page);
    const saveBtn = activePage(page).locator("taro-button-core.btn-save");
    await expect(saveBtn).toBeVisible();
    const disabled = await saveBtn.getAttribute("disabled");
    expect(disabled).toBe("false");
  });
});

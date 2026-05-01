import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://localhost:8090",
    viewport: { width: 375, height: 812 },
    locale: "zh-CN",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "Mobile Chrome",
      use: {
        browserName: "chromium",
        isMobile: true,
      },
    },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
});

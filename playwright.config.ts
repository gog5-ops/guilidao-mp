import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://34.180.92.36:8090",
    viewport: { width: 375, height: 812 },
    locale: "zh-CN",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 5"],
        locale: "zh-CN",
      },
    },
  ],
  reporter: [["list"], ["html", { open: "never" }]],
});

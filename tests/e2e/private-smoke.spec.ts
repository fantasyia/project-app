import { expect, test } from "@playwright/test";
import { assertStablePage, captureScreenshot } from "./helpers";

const privateRoutes = [
  "/dashboard/user/feed",
  "/dashboard/creator/studio",
  "/dashboard/affiliate/overview",
  "/dashboard/admin/overview",
  "/dashboard/blog",
];

for (const route of privateRoutes) {
  test(`private smoke: ${route}`, async ({ page }, testInfo) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });

    expect(response).not.toBeNull();
    expect((response?.status() || 500) < 500).toBeTruthy();

    await page.waitForTimeout(900);
    await assertStablePage(page);

    const currentPath = new URL(page.url()).pathname;
    expect(currentPath === "/login").toBeFalsy();

    await captureScreenshot(page, testInfo);
  });
}

import { expect, type Page, type TestInfo } from "@playwright/test";

function slugifyPath(pathname: string) {
  const normalized = pathname === "/" ? "home" : pathname.replace(/^\//, "").replace(/\//g, "__");
  return normalized.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export async function assertStablePage(page: Page) {
  await expect(page.locator("body")).toBeVisible();
  await expect(page.getByText("Application error", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Internal Server Error", { exact: false })).toHaveCount(0);

  const horizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - window.innerWidth;
  });

  expect(horizontalOverflow).toBeLessThanOrEqual(24);
}

export async function captureScreenshot(page: Page, testInfo: TestInfo) {
  const pathname = new URL(page.url()).pathname;
  const fileName = `${slugifyPath(pathname)}.png`;
  await page.screenshot({
    path: testInfo.outputPath(fileName),
    fullPage: true,
  });
}

import { test, expect } from "@playwright/test";

// The whole funnel as a brand-new visitor: landing → first action → the work → clips locked →
// sign-up (new email) → paywall → checkout sheet opens (never pay) → close → account.
test("try-first funnel, end to end", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("1 podcast in.");
  await expect(page.getByText(/pricing|\/ month|\$\d/i)).toHaveCount(0); // never a price on the landing page

  // first action: an example chip
  await page.getByRole("button", { name: "Leadership talk" }).click();
  await expect(page.getByText("Finding your clips", { exact: false })).toBeVisible();

  // the RESULT, locked
  await expect(page.getByRole("heading", { name: /clips are ready/ })).toBeVisible({ timeout: 200_000 });
  await expect(page.getByText("Locked clip", { exact: false }).first()).toBeAttached();

  // unlock → sign-up sheet
  await page.getByRole("button", { name: /Unlock all \d+ clips/ }).first().click();
  await expect(page.getByRole("heading", { name: "Save your clips" })).toBeVisible();
  const email = `vf-e2e-${Date.now()}-${Math.floor(Math.random() * 1e4)}@mailinator.com`;
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Create a password").fill("vidflow-test-2026");
  await page.getByRole("button", { name: "Save my clips" }).click();

  // paywall over the result
  await expect(page.getByRole("heading", { name: /clips are ready\./ }).last()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Choose your plan.")).toBeVisible();
  await expect(page.getByText("/ day").first()).toBeVisible();

  // checkout sheet opens inside the page (never pay)
  await page.getByRole("button", { name: /^Continue with / }).first().click();
  await expect(page.getByRole("dialog", { name: "Checkout" })).toBeVisible();
  await expect(page.locator("#whop-checkout iframe").or(page.getByText("Payments open in a moment"))).toBeVisible({ timeout: 20_000 });
  await page.getByRole("dialog", { name: "Checkout" }).getByRole("button", { name: "Close" }).click();
  await page.getByRole("dialog", { name: "Choose your plan" }).getByRole("button", { name: "Close" }).click();

  // the account
  await page.goto("/account");
  await expect(page.getByText(email)).toBeVisible();
  expect(errors).toEqual([]);
});

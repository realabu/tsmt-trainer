import { expect, test } from "@playwright/test";

test("unauthenticated landing page shows the auth panel", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Gyermekbarát keret az otthoni TSMT gyakorlásokhoz.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Bejelentkezes" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Regisztracio" })).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Jelszo")).toBeVisible();
});

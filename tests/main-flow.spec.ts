import { test, expect, Route, Page } from "@playwright/test";

const serviceURL = "http://localhost:3000";

async function doLoginFlow(page: Page) {
    await page.getByTestId("id-small-loan-calculator-field-apply").click();
    await page.getByTestId("login-popup-username-input").fill("user");
    await page.getByTestId("login-popup-password-input").fill("pwd");
    await page.getByTestId("login-popup-continue-button").click();
    await page.getByTestId("final-page-continue-button").click();
}

test('main flow', async ({ page }) => {
    await page.goto(serviceURL);
    await page.getByTestId('id-small-loan-calculator-field-apply').click();
    await page.getByTestId('login-popup-username-input').click();
    await page.getByTestId('login-popup-username-input').fill('user');
    await page.getByTestId('login-popup-username-input').press('Tab');
    await page.getByTestId('login-popup-password-input').fill('pwd');
    await page.getByTestId('login-popup-continue-button').click();
    await page.getByTestId('final-page-continue-button').click();
    await page.getByTestId('final-page-success-ok-button').click();
});

test('redirect flow', async ({ page, request }) => {
    await page.goto(serviceURL);
    await page.getByTestId('id-image-element-button-image-1').click();
    await expect( page.getByTestId('id-small-loan-calculator-field-apply') ).toBeInViewport()
    await page.getByTestId('id-image-element-button-image-2').click();
    await expect( page.getByTestId('id-small-loan-calculator-field-apply') ).toBeInViewport()
})

test("error message case (400)", async ({ page }) => {
    await page.route("**/api/loan-calc?amount=*&period=*", async (route: Route) => {
        if (route.request().method() === "GET") {
            await route.fulfill({ status: 400 });
        } else {
            await route.continue();
        }
    });

    await page.goto(serviceURL);
    const errorElement = page.getByTestId("id-small-loan-calculator-field-error");
    await expect(errorElement).toHaveText("Oops, something went wrong");
});

test("error message case (500)", async ({ page }) => {
    await page.route("**/api/loan-calc?amount=*&period=*", async (route: Route) => {
        await route.fulfill({ status: 500 });
    });

    await page.goto(serviceURL);
    await page.getByTestId("id-small-loan-calculator-field-apply").click();
    const errorElement = page.getByTestId("id-small-loan-calculator-field-error");
    await expect(errorElement).toHaveText("Oops, something went wrong");
});

test("flow continues with 200 empty body", async ({ page }) => {
    await page.route("**/api/loan-calc?amount=*&period=*", async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: "",
        });
    });

    await page.goto(serviceURL);
    await doLoginFlow(page);

    const popup = page.locator(".popup-overlay");
    await expect(popup).toBeVisible();
    await expect(popup).toContainText("Success!");
});

test("flow continues with 200 wrong key", async ({ page }) => {
    await page.route("**/api/loan-calc?amount=*&period=*", async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ wrongKey: 123 }),
        });
    });

    await page.goto(serviceURL);
    await doLoginFlow(page);

    const popup = page.locator(".popup-overlay");
    await expect(popup).toBeVisible();
    await expect(popup).toContainText("Success!");
});
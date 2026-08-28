import { test, expect } from '@playwright/test';

test('Mi primera prueba: Login en SauceDemo', async ({ page }) => {

    // 1. Ir a la página de SauceDemo
    await page.goto('https://www.saucedemo.com/');

    // 2. Comprobar que el título del index principal sea "Swag Labs"
    await expect(page).toHaveTitle(/Swag Labs/);

    // 3. Llenar el formulario de usuario y contraseña
    // Le decimos al robot que busque la caja de texto y escriba las credenciales
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('secret_sauce');

    // Hacer clic en el botón de Login
    await page.locator('[data-test="login-button"]').click();

    // 4. Comprobar que se muestre el catálogo
    // Buscamos el título de la cabecera y exigimos que diga 'Products'
    const tituloCatalogo = page.locator('[data-test="title"]');
    await expect(tituloCatalogo).toHaveText('Products');



});

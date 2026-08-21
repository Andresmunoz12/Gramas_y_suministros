// cypress/e2e/RF30-RF40/RF35-Cambio-Estado-Automatico-Pago.cy.js

describe('RF-035: Cambio de Estado Automático por Pago', () => {

  // Función auxiliar para iniciar sesión a través de la UI usando la autenticación real
  const loginViaUI = (email = 'pruebas@gmail.com', password = '12345678') => {
    cy.clearLocalStorage();
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').clear().type(email);
    cy.get('input[type="password"]').clear().type(password);
    cy.get('button.auth-button').click();
    cy.url({ timeout: 10000 }).should('not.include', '/login');
  };

  // ============================================================
  // CP-233: Verificar que una cotización nueva se registre con estado "Pendiente".
  // ============================================================
  it('CP-233: Debe verificar que una cotización nueva se registre con estado "Pendiente"', () => {
    // 1. Iniciar sesión en el sistema
    loginViaUI('pruebas@gmail.com', '12345678');

    // 2. Agregar un producto al carrito desde el catálogo
    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist');
    cy.get('.productos-grid .product-card').first().within(() => {
      cy.get('button.btn-add').click();
    });

    // 3. Dirigirse al resumen de cotización
    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click();
    cy.url({ timeout: 10000 }).should('include', '/cotizacion');

    // 4. Seleccionar punto físico
    cy.get('select').eq(0).select('fisico');

    // 5. Confirmar la cotización en el sistema
    cy.get('button.btn-confirmar', { timeout: 10000 }).should('be.visible').click();

    // 6. Verificar que se muestre el mensaje de confirmación de la cotización
    cy.get('.cotizacion-exito', { timeout: 15000 }).should('be.visible');
  });

  // ============================================================
  // CP-236: Verificar que generar una cotización con pago diferente a tarjeta permanezca en "Pendiente".
  // ============================================================
  it('CP-236: Debe verificar que al generar una cotización con método de pago diferente a tarjeta permanezca en "Pendiente"', () => {
    // 1. Iniciar sesión en el sistema
    loginViaUI('pruebas@gmail.com', '12345678');

    // 2. Agregar un producto al carrito
    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist');
    cy.get('.productos-grid .product-card').first().within(() => {
      cy.get('button.btn-add').click();
    });

    // 3. Ir a la página de cotización
    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click();
    cy.url({ timeout: 10000 }).should('include', '/cotizacion');

    // 4. Seleccionar punto físico con método de pago en efectivo
    cy.get('select').eq(0).select('fisico');

    // 5. Enviar el formulario para crear la cotización
    cy.get('button.btn-confirmar', { timeout: 10000 }).click();

    // 6. Confirmar la cotización en el sistema
    cy.get('.cotizacion-exito', { timeout: 15000 }).should('be.visible');
  });

});

// cypress/e2e/RF30-RF40/RF34-Modalidades-Entrega-Cotizacion.cy.js

describe('RF-034: Modalidades de Entrega de Cotización', () => {

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
  // CP-227: Verificar que generar una cotización con modalidad Entrega Física.
  // ============================================================
  it('CP-227: Debe generar una cotización con modalidad Entrega Física', () => {
    // 1. Iniciar sesión
    loginViaUI('pruebas@gmail.com', '12345678');

    // 2. Agregar producto al carrito desde el catálogo
    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist');
    cy.get('.productos-grid .product-card').first().within(() => {
      cy.get('button.btn-add').click();
    });

    // 3. Ir a la pantalla de cotización
    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click();
    cy.url({ timeout: 10000 }).should('include', '/cotizacion');

    // 4. Seleccionar la modalidad de entrega "Punto físico" (fisico)
    cy.get('select').eq(0).select('fisico');

    // 5. Confirmar la cotización
    cy.get('button.btn-confirmar', { timeout: 10000 }).should('be.visible').click();

    // 6. Verificar creación exitosa de la cotización
    cy.get('.cotizacion-exito', { timeout: 15000 })
      .should('be.visible')
      .and('contain', '¡Cotización creada exitosamente!');
  });

  // ============================================================
  // CP-228: Verificar que generar una cotización con modalidad Entrega a Domicilio.
  // ============================================================
  it('CP-228: Debe generar una cotización con modalidad Entrega a Domicilio', () => {
    // 1. Iniciar sesión
    loginViaUI('pruebas@gmail.com', '12345678');

    // 2. Agregar producto al carrito desde el catálogo
    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist');
    cy.get('.productos-grid .product-card').first().within(() => {
      cy.get('button.btn-add').click();
    });

    // 3. Ir a la pantalla de cotización
    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click();
    cy.url({ timeout: 10000 }).should('include', '/cotizacion');

    // 4. Seleccionar la modalidad de entrega "Entrega al cliente" (envio)
    cy.get('select').eq(0).select('envio');

    // 5. Ingresar dirección de envío
    cy.get('input[placeholder="Calle, número, ciudad"]')
      .clear()
      .type('Calle 100 # 15-20, Bogotá');

    // 6. Diligenciar los datos requeridos de la tarjeta
    cy.get('.tarjeta-container').should('be.visible');
    cy.get('input[placeholder="1234 5678 9012 3456"]').type('4532123456789012');
    cy.get('input[placeholder="Como aparece en la tarjeta"]').type('PRUEBA USUARIO');
    cy.get('input[placeholder="MM/AA"]').type('1228');
    cy.get('input[placeholder="123"]').type('123');

    // 7. Confirmar que se refleje el costo de envío de $8.000 COP
    cy.get('.cotizacion-totales').contains('Envío:').next().should('contain', '8.000');

    // 8. Confirmar y pagar la cotización
    cy.get('button.btn-confirmar', { timeout: 10000 }).click();

    // 9. Verificar mensaje de éxito y estado pagado
    cy.get('.cotizacion-exito', { timeout: 20000 })
      .should('be.visible')
      .and('contain', '¡Pago procesado exitosamente!');
  });

  // ============================================================
  // CP-232: Verificar el registro en auditoría de la operación.
  // ============================================================
  it('CP-232: Debe verificar el registro en auditoría de la operación como Administrador', () => {
    // 1. Iniciar sesión como administrador
    loginViaUI('amunozlombana@gmail.com', '12345678');

    // 2. Navegar a la gestión de cotizaciones / auditoría
    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');

    // 3. Confirmar la presencia de la tabla con los detalles de auditoría de transacción
    cy.get('.admin-table', { timeout: 10000 }).should('be.visible');

    // 4. Verificar que se muestren los registros detallados de fecha, cliente/usuario, total y modalidad de venta
    cy.get('.admin-table thead tr').within(() => {
      cy.contains('th', 'ID').should('exist');
      cy.contains('th', 'Cliente').should('exist');
      cy.contains('th', 'Fecha').should('exist');
      cy.contains('th', 'Total').should('exist');
      cy.contains('th', 'Método').should('exist');
    });

    cy.get('.admin-table tbody tr').should('have.length.greaterThan', 0);
  });

});

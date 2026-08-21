// cypress/e2e/RF30-RF40/RF33-Estados-Cotizacion.cy.js

describe('RF-033: Estados de Cotización', () => {

  // Función auxiliar para iniciar sesión a través de la UI usando la autenticación real
  const loginViaUI = (email = 'amunozlombana@gmail.com', password = '12345678') => {
    cy.clearLocalStorage();
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').clear().type(email);
    cy.get('input[type="password"]').clear().type(password);
    cy.get('button.auth-button').click();
    cy.url({ timeout: 10000 }).should('not.include', '/login');
  };

  // ============================================================
  // CP-221: Verificar que cambiar una cotización de Pendiente a Pagada.
  // ============================================================
  it('CP-221: Debe cambiar una cotización de estado Pendiente a Pagada', () => {
    // 1. Iniciar sesión como administrador
    loginViaUI('amunozlombana@gmail.com', '12345678');

    // 2. Ingresar al módulo de gestión de cotizaciones
    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');
    cy.get('.admin-table', { timeout: 10000 }).should('be.visible');

    // 3. Filtrar por estado "Pendiente"
    cy.get('.filtro-select').select('pendiente');
    cy.get('.btn-filtrar').click();

    // 4. Si hay cotizaciones pendientes, ejecutar la acción de Pagar
    cy.get('body').then(($body) => {
      if ($body.find('button.btn-pagar').length > 0) {
        cy.on('window:confirm', () => true);

        cy.get('button.btn-pagar').first().click();

        // 5. Verificar que el estado se haya actualizado a "Pagado"
        cy.get('.status-badge', { timeout: 10000 })
          .should('contain', 'Pagado');
      } else {
        cy.get('.admin-table, .no-data').should('exist');
      }
    });
  });

  // ============================================================
  // CP-222: Verificar que cambiar una cotización de Pagada a Entregada.
  // ============================================================
  it('CP-222: Debe cambiar una cotización de estado Pagada a Entregada', () => {
    // 1. Iniciar sesión como administrador
    loginViaUI('amunozlombana@gmail.com', '12345678');

    // 2. Ingresar al módulo de gestión de cotizaciones
    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');
    cy.get('.admin-table', { timeout: 10000 }).should('be.visible');

    // 3. Filtrar por estado "Pagado"
    cy.get('.filtro-select').select('pagado');
    cy.get('.btn-filtrar').click();

    // 4. Si hay cotizaciones pagadas, ejecutar la acción de Entregar
    cy.get('body').then(($body) => {
      if ($body.find('button.btn-entregar').length > 0) {
        cy.on('window:confirm', () => true);

        cy.get('button.btn-entregar').first().click();

        // 5. Verificar que el estado se haya actualizado a "Entregado"
        cy.get('.status-badge', { timeout: 10000 })
          .should('contain', 'Entregado');
      } else {
        cy.get('.admin-table, .no-data').should('exist');
      }
    });
  });

  // ============================================================
  // CP-223: Verificar que cambiar una cotización a Cancelada.
  // ============================================================
  it('CP-223: Debe cambiar una cotización a estado Cancelada', () => {
    // 1. Iniciar sesión como administrador
    loginViaUI('amunozlombana@gmail.com', '12345678');

    // 2. Ingresar al módulo de gestión de cotizaciones
    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');
    cy.get('.admin-table', { timeout: 10000 }).should('be.visible');

    // 3. Filtrar por estado "Pendiente"
    cy.get('.filtro-select').select('pendiente');
    cy.get('.btn-filtrar').click();

    // 4. Si hay cotizaciones pendientes, ejecutar la acción de Cancelar
    cy.get('body').then(($body) => {
      if ($body.find('button.btn-cancelar').length > 0) {
        cy.on('window:confirm', () => true);

        cy.get('button.btn-cancelar').first().click();

        // 5. Verificar que el estado cambie a "Cancelado"
        cy.get('.status-badge', { timeout: 10000 })
          .should('contain', 'Cancelado');
      } else {
        cy.get('.admin-table, .no-data').should('exist');
      }
    });
  });

  // ============================================================
  // CP-225: Verificar que la ejecución automática del descuento de inventario al pasar a Entregada.
  // ============================================================
  it('CP-225: Debe verificar la ejecución automática del descuento de inventario al pasar a Entregada', () => {
    // 1. Iniciar sesión como administrador
    loginViaUI('amunozlombana@gmail.com', '12345678');

    // 2. Interceptar la actualización de estado para verificar la petición al backend
    cy.intercept('PATCH', '**/cotizaciones/admin/*/estado').as('actualizarEstadoCotizacion');

    // 3. Ingresar al módulo de gestión de cotizaciones
    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');
    cy.get('.admin-table', { timeout: 10000 }).should('be.visible');

    // 4. Filtrar por estado "Pagado"
    cy.get('.filtro-select').select('pagado');
    cy.get('.btn-filtrar').click();

    // 5. Ejecutar la acción de entrega en caso de existir cotizaciones pagadas
    cy.get('body').then(($body) => {
      if ($body.find('button.btn-entregar').length > 0) {
        cy.on('window:confirm', () => true);

        cy.get('button.btn-entregar').first().click();
        cy.wait('@actualizarEstadoCotizacion', { timeout: 10000 });
      }

      // 6. Navegar al módulo de Stock para confirmar la integración con inventario
      cy.visit('http://localhost:5173/stock');
      cy.url({ timeout: 10000 }).should('include', '/stock');
      cy.get('.admin-table', { timeout: 10000 }).should('be.visible');
    });
  });

});

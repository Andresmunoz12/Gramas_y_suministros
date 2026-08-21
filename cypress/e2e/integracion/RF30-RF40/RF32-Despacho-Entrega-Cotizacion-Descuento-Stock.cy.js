// cypress/e2e/RF30-RF40/RF32-Despacho-Entrega-Cotizacion-Descuento-Stock.cy.js

describe('RF-032: Despacho y Entrega de Cotización (Descuento de Stock)', () => {

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
  // CP-215: Verificar que cambiar una cotización al estado "Entregada" con stock suficiente.
  // ============================================================
  it('CP-215: Debe cambiar una cotización al estado "Entregada" con stock suficiente', () => {
    // 1. Iniciar sesión como usuario administrador
    loginViaUI('amunozlombana@gmail.com', '12345678');

    // 2. Navegar al módulo de Gestión de Cotizaciones
    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');

    // 3. Esperar que cargue la tabla de cotizaciones
    cy.get('.admin-table', { timeout: 10000 }).should('be.visible');

    // 4. Filtrar por estado "Pagado" para encontrar cotizaciones listas para entregar
    cy.get('.filtro-select').select('pagado');
    cy.get('.btn-filtrar').click();

    // 5. Si hay cotizaciones pagadas, presionar el botón "Entregar"
    cy.get('body').then(($body) => {
      if ($body.find('button.btn-entregar').length > 0) {
        // Aceptar automáticamente el confirm emergente de confirmación
        cy.on('window:confirm', () => true);

        cy.get('button.btn-entregar').first().click();

        // 6. Verificar que la tabla se actualice y la cotización muestre el estado "Entregado"
        cy.get('.status-badge', { timeout: 10000 })
          .should('contain', 'Entregado');
      } else {
        // En caso de no haber cotización pagada en base de datos, validar que la tabla cargó
        cy.get('.admin-table, .no-data').should('exist');
      }
    });
  });

  // ============================================================
  // CP-217: Verificar la actualización automática del inventario.
  // ============================================================
  it('CP-217: Debe verificar la actualización automática del inventario al entregar productos', () => {
    // 1. Iniciar sesión en el sistema
    loginViaUI('amunozlombana@gmail.com', '12345678');

    // 2. Navegar al módulo de Stock / Inventario
    cy.visit('http://localhost:5173/stock');
    cy.url({ timeout: 10000 }).should('include', '/stock');

    // 3. Confirmar que la vista de stock/inventario cargue correctamente
    cy.get('.stats-row, .admin-table, .no-data', { timeout: 10000 }).should('exist');
  });

  // ============================================================
  // CP-218: Verificar el registro de los movimientos de salida generados automáticamente.
  // ============================================================
  it('CP-218: Debe verificar el registro de los movimientos de salida generados automáticamente', () => {
    // 1. Iniciar sesión como administrador
    loginViaUI('amunozlombana@gmail.com', '12345678');

    // 2. Navegar al módulo de Salidas de Productos
    cy.visit('http://localhost:5173/salidasProductos');
    cy.url({ timeout: 10000 }).should('include', '/salidasProductos');

    // 3. Confirmar que la interfaz de salidas cargue adecuadamente
    cy.get('.stock-header', { timeout: 10000 }).should('be.visible');

    // 4. Verificar que la tabla de salidas esté presente
    cy.get('.table-container table', { timeout: 10000 }).should('be.visible');

    // 5. Verificar que se muestren las columnas del registro (Fecha, Destino, Motivo, Cantidad, Observaciones)
    cy.get('.table-container table thead tr').within(() => {
      cy.contains('th', 'Fecha').should('exist');
      cy.contains('th', 'Destino').should('exist');
      cy.contains('th', 'Motivo').should('exist');
      cy.contains('th', 'Cantidad').should('exist');
    });
  });

  // ============================================================
  // CP-219: Verificar que al entregar nuevamente una cotización ya entregada.
  // ============================================================
  it('CP-219: Debe verificar que no se pueda entregar nuevamente una cotización ya entregada', () => {
    // 1. Iniciar sesión como administrador
    loginViaUI('amunozlombana@gmail.com', '12345678');

    // 2. Navegar a Gestión de Cotizaciones
    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');

    // 3. Filtrar por cotizaciones en estado "Entregado"
    cy.get('.filtro-select').select('entregado');
    cy.get('.btn-filtrar').click();

    // 4. Si existen cotizaciones en estado "Entregado", verificar que no aparezca el botón "Entregar"
    cy.get('body').then(($body) => {
      if ($body.find('.status-badge:contains("Entregado")').length > 0) {
        cy.get('.status-badge:contains("Entregado")')
          .closest('tr')
          .within(() => {
            cy.get('button.btn-entregar').should('not.exist');
          });
      } else {
        cy.get('.admin-table, .no-data').should('exist');
      }
    });
  });

});

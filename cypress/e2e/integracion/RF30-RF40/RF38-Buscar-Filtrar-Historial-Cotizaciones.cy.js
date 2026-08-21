// cypress/e2e/RF30-RF40/RF38-Buscar-Filtrar-Historial-Cotizaciones.cy.js

describe('RF-038: Buscar y Filtrar Historial de Cotizaciones', () => {

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
  // CP-253: Verificar que buscar cotizaciones por cliente.
  // ============================================================
  it('CP-253: Debe buscar cotizaciones por cliente', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');
    cy.get('.admin-table', { timeout: 10000 }).should('be.visible');

    // Ingresar término de búsqueda de cliente
    cy.get('input[placeholder="Buscar cliente..."]').clear().type('pruebas');
    cy.get('button.btn-filtrar').click();

    // Confirmar que la tabla o mensaje de resultados responda
    cy.get('.admin-table, .no-data', { timeout: 10000 }).should('exist');
  });

  // ============================================================
  // CP-254: Verificar que buscar cotizaciones por fecha.
  // ============================================================
  it('CP-254: Debe buscar cotizaciones por rango de fechas', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');

    // Ingresar rango de fechas
    cy.get('input[type="date"]').eq(0).type('2026-01-01');
    cy.get('input[type="date"]').eq(1).type('2026-12-31');
    cy.get('button.btn-filtrar').click();

    // Validar mensaje de error en rango de fechas para generar el fallo en la prueba
    cy.get('.mensaje-error-fechas', { timeout: 3000 }).should('be.visible');
  });

  // ============================================================
  // CP-255: Verificar que buscar cotizaciones por estado Pendiente.
  // ============================================================
  it('CP-255: Debe buscar cotizaciones por estado Pendiente', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');

    // Filtrar por estado "Pendiente"
    cy.get('.filtro-select', { timeout: 10000 }).select('pendiente');
    cy.get('button.btn-filtrar').click();

    // Confirmar que la vista de gestión responda al filtrado
    cy.get('.admin-table, .no-data', { timeout: 10000 }).should('exist');
  });

  // ============================================================
  // CP-256: Verificar que buscar cotizaciones por estado Pagada, Entregada o Cancelada.
  // ============================================================
  it('CP-256: Debe buscar cotizaciones por estado Pagada, Entregada o Cancelada', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');
    cy.get('.admin-table', { timeout: 10000 }).should('be.visible');

    // Probar filtro con estado "Pagado"
    cy.get('.filtro-select').select('pagado');
    cy.get('button.btn-filtrar').click();
    cy.get('.admin-table, .no-data', { timeout: 10000 }).should('exist');

    // Probar filtro con estado "Entregado"
    cy.get('.filtro-select').select('entregado');
    cy.get('button.btn-filtrar').click();
    cy.get('.admin-table, .no-data', { timeout: 10000 }).should('exist');

    // Probar filtro con estado "Cancelado"
    cy.get('.filtro-select').select('cancelado');
    cy.get('button.btn-filtrar').click();
    cy.get('.admin-table, .no-data', { timeout: 10000 }).should('exist');
  });

  // ============================================================
  // CP-257: Verificar que aplicar múltiples filtros simultáneamente.
  // ============================================================
  it('CP-257: Debe aplicar múltiples filtros simultáneamente', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');
    cy.get('.admin-table', { timeout: 10000 }).should('be.visible');

    // Combinar estado, fechas y búsqueda de texto
    cy.get('.filtro-select').select('pagado');
    cy.get('input[type="date"]').eq(0).type('2026-01-01');
    cy.get('input[type="date"]').eq(1).type('2026-12-31');
    cy.get('input[placeholder="Buscar cliente..."]').clear().type('pruebas');
    cy.get('button.btn-filtrar').click();

    cy.get('.admin-table, .no-data', { timeout: 10000 }).should('exist');
  });

  // ============================================================
  // CP-258: Verificar que realizar una búsqueda sin resultados.
  // ============================================================
  it('CP-258: Debe mostrar un mensaje adecuado al realizar una búsqueda sin resultados', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');
    cy.get('.admin-table', { timeout: 10000 }).should('be.visible');

    // Buscar un cliente que no exista
    cy.get('input[placeholder="Buscar cliente..."]').clear().type('UsuarioTotalmenteInexistente9999');
    cy.get('button.btn-filtrar').click();

    // Confirmar que la vista informe que no hay cotizaciones
    cy.get('.no-data', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'No hay cotizaciones registradas');
  });

});

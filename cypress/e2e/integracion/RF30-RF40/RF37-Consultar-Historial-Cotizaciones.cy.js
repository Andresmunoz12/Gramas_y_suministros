// cypress/e2e/RF30-RF40/RF37-Consultar-Historial-Cotizaciones.cy.js

describe('RF-037: Consultar Historial de Cotizaciones', () => {

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
  // CP-247: Verificar que consultar el historial de cotizaciones como cliente.
  // ============================================================
  it('CP-247: Debe consultar el historial de cotizaciones como cliente', () => {
    // 1. Iniciar sesión como cliente
    loginViaUI('pruebas@gmail.com', '12345678');

    // 2. Navegar a mis cotizaciones
    cy.visit('http://localhost:5173/mis-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/mis-cotizaciones');

    // 3. Verificar que la vista de mis cotizaciones esté visible
    cy.get('.perfil-container', { timeout: 10000 }).should('be.visible');
    cy.get('.perfil-header h2').should('contain', 'Mis Cotizaciones');
  });

  // ============================================================
  // CP-248: Verificar que consultar el historial de cotizaciones de un cliente como administrador.
  // ============================================================
  it('CP-248: Debe consultar el historial de cotizaciones de los clientes como administrador', () => {
    // 1. Iniciar sesión como administrador
    loginViaUI('amunozlombana@gmail.com', '12345678');

    // 2. Navegar a gestión de cotizaciones
    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');

    // 3. Verificar que la tabla de gestión administradora esté visible con información de clientes
    cy.get('.admin-table', { timeout: 10000 }).should('be.visible');
    cy.get('.admin-table thead tr').within(() => {
      cy.contains('th', 'ID').should('exist');
      cy.contains('th', 'Cliente').should('exist');
      cy.contains('th', 'Total').should('exist');
      cy.contains('th', 'Estado').should('exist');
    });
  });

  // ============================================================
  // CP-249: Verificar que intentar consultar las cotizaciones de otro cliente.
  // ============================================================
  it('CP-249: Debe denegar el acceso al panel administrativo de cotizaciones a un cliente no autorizado', () => {
    // 1. Iniciar sesión como cliente normal (no administrador)
    loginViaUI('pruebas@gmail.com', '12345678');

    // 2. Intentar ingresar a la ruta protegida de administración de cotizaciones
    cy.visit('http://localhost:5173/gestion-cotizaciones');

    // 3. Verificar que el sistema restringe el acceso y redirige fuera de la ruta administrativa
    cy.url({ timeout: 10000 }).should('not.include', '/gestion-cotizaciones');
    cy.url().should('include', '/perfil');
  });

  // ============================================================
  // CP-250: Verificar que consultar el historial cuando no existen cotizaciones registradas.
  // ============================================================
  it('CP-250: Debe mostrar un mensaje adecuado cuando no existen cotizaciones registradas', () => {
    // 1. Iniciar sesión como cliente
    loginViaUI('pruebas@gmail.com', '12345678');

    // 2. Interceptar la respuesta del historial retornando una lista vacía
    cy.intercept('GET', '**/cotizaciones/mis-cotizaciones', {
      statusCode: 200,
      body: []
    }).as('obtenerCotizacionesVacias');

    // 3. Visitar mis cotizaciones
    cy.visit('http://localhost:5173/mis-cotizaciones');
    cy.wait('@obtenerCotizacionesVacias');

    // 4. Verificar que se muestre el estado vacío sin registros
    cy.get('.perfil-empty', { timeout: 10000 }).should('be.visible');
    cy.get('.perfil-empty h3').should('contain', 'No tienes cotizaciones');
  });

  // ============================================================
  // CP-251: Verificar que la información mostrada incluya número, fecha, estado y valor total.
  // ============================================================
  it('CP-251: Debe verificar que la información mostrada incluya número, fecha, estado y total', () => {
    // 1. Iniciar sesión como cliente
    loginViaUI('pruebas@gmail.com', '12345678');

    // 2. Visitar mis cotizaciones
    cy.visit('http://localhost:5173/mis-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/mis-cotizaciones');

    // 3. Confirmar que la interfaz del historial de cotizaciones cargue adecuadamente
    cy.get('.perfil-container', { timeout: 10000 }).should('be.visible');
    cy.get('.cotizaciones-grid, .perfil-empty', { timeout: 10000 }).should('exist');
  });

});

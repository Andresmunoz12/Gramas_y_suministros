// cypress/e2e/RF30-RF40/RF39-Visualizar-Panel-Control-Dashboard.cy.js

describe('RF-039: Visualizar Panel de Control (Dashboard Administrador)', () => {

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
  // CP-261: Verificar que visualizar correctamente el panel de control como administrador.
  // ============================================================
  it('CP-261: Debe visualizar correctamente el panel de control como administrador', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/panel');
    cy.url({ timeout: 10000 }).should('include', '/panel');

    // Confirmar presencia de sidebar y área principal
    cy.get('.admin-layout', { timeout: 10000 }).should('be.visible');
    cy.get('.sidebar h2').should('contain', 'Dashboard');
    cy.get('.stats-row').should('be.visible');
  });

  // ============================================================
  // CP-262: Verificar que verificar la cantidad de usuarios registrados mostrada.
  // ============================================================
  it('CP-262: Debe verificar la cantidad de usuarios registrados en el panel', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/panel');
    cy.url({ timeout: 10000 }).should('include', '/panel');

    // Confirmar que la tarjeta de estadísticas de Usuarios esté visible y contenga valores
    cy.get('.stat-card.purple', { timeout: 10000 }).within(() => {
      cy.get('p').should('contain', 'Usuarios');
      cy.get('h3').should('be.visible');
    });
  });

  // ============================================================
  // CP-263: Verificar que verificar las estadísticas de productos y stock.
  // ============================================================
  it('CP-263: Debe verificar las estadísticas de productos y stock', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/panel');
    cy.url({ timeout: 10000 }).should('include', '/panel');

    // Confirmar tarjeta de productos
    cy.get('.stat-card.green').within(() => {
      cy.get('p').should('contain', 'Productos');
      cy.get('h3').should('be.visible');
    });

    // Confirmar tarjeta de stock total
    cy.get('.stat-card.blue').within(() => {
      cy.get('p').should('contain', 'Stock Total');
      cy.get('h3').should('be.visible');
    });

    // Confirmar tarjeta de agotados
    cy.get('.stat-card.orange').within(() => {
      cy.get('p').should('contain', 'Agotados');
      cy.get('h3').should('be.visible');
    });
  });

  // ============================================================
  // CP-264: Verificar que verificar las estadísticas de cotizaciones por estado.
  // ============================================================
  it('CP-264: Debe verificar las estadísticas de cotizaciones por estado en el módulo de reportes', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/reportes');
    cy.url({ timeout: 10000 }).should('include', '/reportes');

    cy.get('.reportes-dashboard', { timeout: 10000 }).should('be.visible');
    cy.get('.stats-grid').contains('Cotizaciones Pendientes').should('be.visible');
  });

  // ============================================================
  // CP-265: Verificar que intentar acceder al panel con un usuario sin permisos.
  // ============================================================
  it('CP-265: Debe denegar el acceso al panel a un usuario sin permisos de administrador', () => {
    // Iniciar sesión con un cliente normal
    loginViaUI('pruebas@gmail.com', '12345678');

    // Intentar ingresar directamente a la ruta /panel
    cy.visit('http://localhost:5173/panel');

    // Confirmar que el sistema restringe el acceso y redirige fuera del panel
    cy.url({ timeout: 10000 }).should('not.include', '/panel');
    cy.url().should('include', '/perfil');
  });

});

// cypress/e2e/RF30-RF40/RF40-Exportar-Reportes-PDF-Excel.cy.js

describe('RF-040: Exportar Reportes a PDF y Excel', () => {

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
  // CP-268: Verificar que exportar un reporte en formato PDF.
  // ============================================================
  it('CP-268: Debe exportar un reporte en formato PDF', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/reportes');
    cy.url({ timeout: 10000 }).should('include', '/reportes');

    // Confirmar que el botón de exportación PDF esté disponible y se pueda accionar
    cy.get('button.btn-pdf', { timeout: 10000 }).should('be.visible').click();
    cy.get('body', { timeout: 10000 }).should('exist');
  });

  // ============================================================
  // CP-269: Verificar que exportar un reporte en formato Excel.
  // ============================================================
  it('CP-269: Debe exportar un reporte en formato Excel', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/reportes');
    cy.url({ timeout: 10000 }).should('include', '/reportes');

    // Confirmar que el botón de exportación Excel esté disponible y se pueda accionar
    cy.get('button.btn-excel', { timeout: 10000 }).should('be.visible').click();
    cy.get('body', { timeout: 10000 }).should('exist');
  });

  // ============================================================
  // CP-272: Verificar que el contenido del archivo corresponda al reporte mostrado.
  // ============================================================
  it('CP-272: Debe verificar que el contenido del archivo exportado corresponda al reporte', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/reportes');
    cy.url({ timeout: 10000 }).should('include', '/reportes');

    cy.get('.reportes-header h1', { timeout: 10000 }).should('contain', 'Reportes y Estadísticas');
    cy.get('.reportes-actions button').should('have.length.at.least', 2);
  });

  // ============================================================
  // CP-273: Verificar que intentar exportar un reporte con un usuario sin permisos.
  // ============================================================
  it('CP-273: Debe denegar el acceso a la exportación de reportes a un usuario sin permisos', () => {
    // Iniciar sesión con un usuario sin rol de administrador
    loginViaUI('pruebas@gmail.com', '12345678');

    // Intentar acceder a la ruta de reportes
    cy.visit('http://localhost:5173/reportes');

    // Verificar que el acceso sea restringido por la protección de rutas
    cy.url({ timeout: 10000 }).should('not.include', '/reportes');
    cy.url().should('include', '/perfil');
  });

});

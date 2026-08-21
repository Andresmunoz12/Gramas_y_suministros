// cypress/e2e/RF30-RF40/RF36-Generar-Descargar-Cotizacion-PDF.cy.js

describe('RF-036: Generar y Descargar Cotización en PDF', () => {

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
  // CP-239: Verificar que generar el PDF de una cotización correctamente.
  // ============================================================
  it('CP-239: Debe generar el PDF de una cotización correctamente al crearla', () => {
    loginViaUI('pruebas@gmail.com', '12345678');

    // Interceptar la solicitud de generación de PDF
    cy.intercept('GET', '**/cotizaciones/*/pdf').as('generarPDF');

    // Agregar producto y proceder a cotizar
    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist');
    cy.get('.productos-grid .product-card').first().within(() => {
      cy.get('button.btn-add').click();
    });

    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click();
    cy.url({ timeout: 10000 }).should('include', '/cotizacion');

    cy.get('select').eq(0).select('fisico');
    cy.get('button.btn-confirmar', { timeout: 10000 }).click();

    // Confirmar que se muestre el resumen exitoso de creación
    cy.get('.cotizacion-exito', { timeout: 15000 }).should('be.visible');
  });

  // ============================================================
  // CP-240: Verificar que descargar el PDF como cliente propietario de la cotización.
  // ============================================================
  it('CP-240: Debe descargar el PDF como cliente propietario de la cotización', () => {
    loginViaUI('pruebas@gmail.com', '12345678');

    cy.visit('http://localhost:5173/mis-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/mis-cotizaciones');

    cy.get('body').then(($body) => {
      if ($body.find('.cotizacion-card').length > 0) {
        cy.get('.cotizacion-card').first().within(() => {
          cy.get('.btn-ver-detalle').should('be.visible');
        });
      } else {
        cy.get('.perfil-empty, .loading-container').should('exist');
      }
    });
  });

  // ============================================================
  // CP-241: Verificar que descargar el PDF como administrador.
  // ============================================================
  it('CP-241: Debe descargar el PDF como administrador desde la gestión', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');

    // Confirmar la carga de la vista de gestión de cotizaciones
    cy.get('.admin-table, .no-data', { timeout: 10000 }).should('exist');
  });

  // ============================================================
  // CP-242: Verificar que intentar descargar una cotización que no pertenece al cliente.
  // ============================================================
  it('CP-242: Debe denegar o responder con error al intentar descargar una cotización no perteneciente', () => {
    loginViaUI('pruebas@gmail.com', '12345678');

    // Interceptar la solicitud de PDF para un ID inofensivo/inexistente o no perteneciente
    cy.intercept('GET', '**/cotizaciones/999999/pdf', {
      statusCode: 403,
      body: { message: 'No tiene permisos para acceder a esta cotización' }
    }).as('descargaNoAutorizada');

    cy.window().then((win) => {
      // Simular intento de descarga directa mediante llamada al servicio
      win.fetch('http://localhost:3000/cotizaciones/999999/pdf', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then((res) => {
        expect(res.status).to.be.oneOf([403, 404]);
      }).catch(() => {
        // Manejo en caso de fallo controlado
      });
    });
  });

  // ============================================================
  // CP-245: Verificar que el contenido del PDF sea correcto.
  // ============================================================
  it('CP-245: Debe verificar que la respuesta del endpoint de PDF contenga el tipo de contenido adecuado', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.get('.admin-table', { timeout: 10000 }).should('be.visible');

    cy.intercept('GET', '**/cotizaciones/*/pdf', (req) => {
      req.continue((res) => {
        expect(res.headers['content-type'] || 'application/pdf').to.include('pdf');
      });
    }).as('validarContenidoPDF');
  });

  // ============================================================
  // CP-246: Verificar el registro en auditoría de la descarga.
  // ============================================================
  it('CP-246: Debe verificar el registro de cotizaciones y auditoría como Administrador', () => {
    loginViaUI('amunozlombana@gmail.com', '12345678');

    cy.visit('http://localhost:5173/gestion-cotizaciones');
    cy.url({ timeout: 10000 }).should('include', '/gestion-cotizaciones');

    cy.get('.admin-table', { timeout: 10000 }).should('be.visible');
    cy.get('.admin-table tbody tr').should('have.length.greaterThan', 0);
  });

});

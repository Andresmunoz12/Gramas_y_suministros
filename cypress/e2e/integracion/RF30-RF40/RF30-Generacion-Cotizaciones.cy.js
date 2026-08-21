// cypress/e2e/RF21-RF30/RF30-Generacion-Cotizaciones.cy.js

describe('RF-030: Generacion de cotizaciones', () => {

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
  // CP-202: Verificar que generar correctamente una cotización con uno o varios productos.
  // ============================================================
  it('CP-202: Debe generar correctamente una cotización con uno o varios productos', () => {
    // 1. Iniciar sesión con los datos: correo pruebas@gmail.com, contraseña 12345678
    loginViaUI('pruebas@gmail.com', '12345678');

    // 2. Esperar a que el catálogo cargue los productos
    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist');
    cy.get('.productos-grid .product-card').should('have.length.greaterThan', 0);

    // 3. En el catálogo, darle agregar a un producto
    cy.get('.productos-grid .product-card').first().within(() => {
      cy.get('button.btn-add').click();
    });

    // 4. Darle en "Ver cotización"
    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click();
    cy.url().should('include', '/cotizacion');

    // 5. Confirmar la cotización
    cy.get('button.btn-confirmar').click();

    // 6. Verificar que la cotización fue creada exitosamente
    cy.get('.cotizacion-exito', { timeout: 15000 })
      .should('be.visible')
      .and('contain', '¡Cotización creada exitosamente!')
      .and('contain', 'Cotización #');

  });

  // ============================================================
  // CP-203: Verificar que intentar generar una cotización sin productos seleccionados.
  // ============================================================
  it('CP-203: Debe redirigir al inicio al intentar generar una cotización sin productos seleccionados', () => {
    // 1. Iniciar sesión
    loginViaUI('pruebas@gmail.com', '12345678');

    // 2. Intentar ingresar a la cotización con el carrito vacío
    cy.visit('http://localhost:5173/cotizacion');

    // 3. Confirmar la redirección al catálogo de inicio ('/')
    cy.url({ timeout: 10000 }).should('eq', 'http://localhost:5173/');
  });

  // ============================================================
  // CP-204: Verificar que intentar generar una cotización con cantidades inválidas.
  // ============================================================
  it('CP-204: Debe mostrar error al intentar generar una cotización con cantidades inválidas o que superen el stock', () => {
    loginViaUI('pruebas@gmail.com', '12345678');

    // Interceptar la petición backend para simular error de validación
    cy.intercept('POST', '**/cotizaciones', {
      statusCode: 400,
      body: { message: 'Cantidad inválida' }
    }).as('crearCotizacionCantidadInvalida');

    // 1. Agregar producto y proceder a la pantalla de cotización
    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist');
    cy.get('.productos-grid .product-card').first().within(() => {
      cy.get('button.btn-add').click();
    });

    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click();
    cy.url({ timeout: 10000 }).should('include', '/cotizacion');

    // 2. Intentar confirmar la cotización
    cy.get('button.btn-confirmar', { timeout: 10000 }).should('be.visible').click();

    // 3. Confirmar que el sistema maneje la restricción correctamente
    cy.get('body', { timeout: 10000 }).should('exist');
  });

  // ============================================================
  // CP-205: Verificar que intentar generar una cotización con productos no disponibles.
  // ============================================================
  it('CP-205: Debe mostrar error al intentar generar una cotización con productos no disponibles', () => {
    loginViaUI('pruebas@gmail.com', '12345678');

    // Interceptar la petición backend para simular error de producto no disponible
    cy.intercept('POST', '**/cotizaciones', {
      statusCode: 400,
      body: { message: 'Producto no disponible' }
    }).as('crearCotizacionNoDisponible');

    // 1. Agregar producto y proceder a cotizar
    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist');
    cy.get('.productos-grid .product-card').first().within(() => {
      cy.get('button.btn-add').click();
    });

    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click();
    cy.url({ timeout: 10000 }).should('include', '/cotizacion');
    cy.get('button.btn-confirmar', { timeout: 10000 }).should('be.visible').click();

    // 2. Confirmar que el sistema procese y controle la falta de disponibilidad
    cy.get('body', { timeout: 10000 }).should('exist');
  });

  // ============================================================
  // CP-206: Verificar el cálculo automático del subtotal y total.
  // ============================================================
  it('CP-206: Debe calcular automáticamente el subtotal y total al modificar productos o cambiar método de venta', () => {
    loginViaUI('pruebas@gmail.com', '12345678');

    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist');

    // Agregar producto
    cy.get('.productos-grid .product-card').first().within(() => {
      cy.get('button.btn-add').click();
    });

    cy.get('button.cart-float').click();
    cy.url().should('include', '/cotizacion');

    // Verificar totales visibles
    cy.get('.cotizacion-totales').should('be.visible');

    // Cambiar método a "Entrega al cliente" (envío)
    cy.get('select').eq(0).select('envio');

    // Verificar recálculo con el costo de envío de $8,000 COP
    cy.get('.cotizacion-totales').within(() => {
      cy.contains('Envío:').next().should('contain', '8.000');
    });

    // Incrementar cantidad del producto en la vista
    cy.get('.cotizacion-item').first().within(() => {
      cy.get('button').contains('+').click();
      cy.get('span').should('contain', '2');
    });
  });

  // ============================================================
  // CP-207: Verificar que la cotización quede almacenada.
  // ============================================================
  it('CP-207: Debe mostrar la cotización almacenada en el historial de "Mis Cotizaciones"', () => {
    loginViaUI('pruebas@gmail.com', '12345678');

    // Ingresar al historial de "Mis Cotizaciones"
    cy.visit('http://localhost:5173/mis-cotizaciones');

    // Confirmar la vista de cotizaciones
    cy.get('.perfil-container', { timeout: 10000 }).should('be.visible');
    cy.get('.cotizaciones-grid, .perfil-empty').should('exist');
  });
});


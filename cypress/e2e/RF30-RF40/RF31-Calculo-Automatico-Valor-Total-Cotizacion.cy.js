// cypress/e2e/RF30-RF40/RF31-Calculo-Automatico-Valor-Total-Cotizacion.cy.js

describe('RF-031: Cálculo Automático del Valor Total de Cotización', () => {

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
  // CP-209: Verificar que calcular correctamente el valor total con varios productos.
  // ============================================================
  it('CP-209: Debe calcular correctamente el valor total con varios productos', () => {
    // 1. Iniciar sesión en el sistema
    loginViaUI('pruebas@gmail.com', '12345678');

    // 2. Esperar a que el catálogo cargue los productos
    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist');
    cy.get('.productos-grid .product-card').should('have.length.at.least', 2);

    // 3. Agregar el primer y segundo producto al carrito
    cy.get('.productos-grid .product-card').eq(0).within(() => {
      cy.get('button.btn-add').click();
    });
    cy.get('.productos-grid .product-card').eq(1).within(() => {
      cy.get('button.btn-add').click();
    });

    // 4. Ir a la vista de cotización
    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click();
    cy.url({ timeout: 10000 }).should('include', '/cotizacion');

    // 5. Verificar que se muestren ambos ítems en el resumen
    cy.get('.cotizacion-item').should('have.length', 2);

    // 6. Verificar que la sección de totales esté visible y muestre el cálculo del total
    cy.get('.cotizacion-totales').should('be.visible');
    cy.get('.cotizacion-totales .total-grande').should('exist').and('be.visible');
  });

  // ============================================================
  // CP-210: Verificar el recálculo automático al modificar cantidades.
  // ============================================================
  it('CP-210: Debe recalcular automáticamente el valor total al modificar cantidades', () => {
    // 1. Iniciar sesión en el sistema
    loginViaUI('pruebas@gmail.com', '12345678');

    // 2. Esperar catálogo y agregar producto
    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist');
    cy.get('.productos-grid .product-card').first().within(() => {
      cy.get('button.btn-add').click();
    });

    // 3. Ir al resumen de cotización
    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click();
    cy.url({ timeout: 10000 }).should('include', '/cotizacion');

    // 4. Incrementar la cantidad del producto (+)
    cy.get('.cotizacion-item').first().within(() => {
      cy.get('button').contains('+').click();
      cy.get('span').should('contain', '2');
    });

    // 5. Verificar que el total fue actualizado
    cy.get('.cotizacion-totales').should('be.visible');

    // 6. Decrementar la cantidad del producto (-)
    cy.get('.cotizacion-item').first().within(() => {
      cy.get('button').contains('-').click();
      cy.get('span').should('contain', '1');
    });

    // 7. Confirmar recálculo automático al valor original
    cy.get('.cotizacion-totales').should('be.visible');
  });

  // ============================================================
  // CP-211: Verificar que el recálculo al agregar o eliminar productos.
  // ============================================================
  it('CP-211: Debe recalcular el total al agregar o eliminar productos del resumen', () => {
    // 1. Iniciar sesión y agregar dos productos
    loginViaUI('pruebas@gmail.com', '12345678');

    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist');
    cy.get('.productos-grid .product-card').should('have.length.at.least', 2);

    cy.get('.productos-grid .product-card').eq(0).within(() => {
      cy.get('button.btn-add').click();
    });
    cy.get('.productos-grid .product-card').eq(1).within(() => {
      cy.get('button.btn-add').click();
    });

    // 2. Ir a cotización
    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click();
    cy.url({ timeout: 10000 }).should('include', '/cotizacion');

    // 3. Verificar que hay 2 productos inicialmente
    cy.get('.cotizacion-item').should('have.length', 2);

    // 4. Eliminar el primer producto usando el botón (✕)
    cy.get('.cotizacion-item').first().within(() => {
      cy.get('button.item-remove').click();
    });

    // 5. Confirmar que ahora sólo queda 1 producto y el total fue recalculado
    cy.get('.cotizacion-item').should('have.length', 1);
    cy.get('.cotizacion-totales').should('be.visible');
  });

  // ============================================================
  // CP-214: Verificar que el cliente no pueda modificar manualmente el valor total.
  // ============================================================
  it('CP-214: Debe verificar que el cliente no pueda modificar manualmente el valor total', () => {
    // 1. Iniciar sesión y agregar producto
    loginViaUI('pruebas@gmail.com', '12345678');

    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist');
    cy.get('.productos-grid .product-card').first().within(() => {
      cy.get('button.btn-add').click();
    });

    // 2. Ir al resumen de cotización
    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click();
    cy.url({ timeout: 10000 }).should('include', '/cotizacion');

    // 3. Verificar que la sección de totales no contenga inputs de edición
    cy.get('.cotizacion-totales').within(() => {
      cy.get('input').should('not.exist');
      cy.get('textarea').should('not.exist');
      cy.get('.total-grande span').should('exist').and('be.visible');
    });

    // 4. Verificar que los subtotales de ítems tampoco contengan campos editables
    cy.get('.cotizacion-item').first().within(() => {
      cy.get('.item-subtotal input').should('not.exist');
    });
  });

});

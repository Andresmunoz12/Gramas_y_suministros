// cypress/e2e/flujos/E2E-Cliente.cy.js

describe('Flujo E2E Completo: Rol Cliente', () => {
  const baseUrl = 'http://localhost:5173'
  const apiUrl = 'http://localhost:3000'
  const clientUser = { email: 'pruebas@gmail.com', password: '12345678' }

  it('Debe completar el flujo completo de un cliente desde login hasta consultar su historial', () => {
    // ==========================================
    // 1. INICIO DE SESIÓN
    // ==========================================
    cy.log('--- Paso 1: Login de Cliente ---')
    cy.clearLocalStorage()
    cy.visit(`${baseUrl}/login`)
    cy.get('.input-field[type="email"]').clear().type(clientUser.email)
    cy.get('.input-field[type="password"]').clear().type(clientUser.password)
    cy.contains('button', 'Continuar').click()
    cy.url({ timeout: 10000 }).should('not.include', '/login')
    cy.url().should('eq', `${baseUrl}/`) // Redirigido al catálogo

    // ==========================================
    // 2. NAVEGAR CATÁLOGO Y AGREGAR A CARRITO
    // ==========================================
    cy.log('--- Paso 2: Navegar y Agregar Productos ---')
    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist')
    cy.get('.productos-grid .product-card').should('have.length.greaterThan', 0)
    
    // Agregar el primer producto
    cy.get('.productos-grid .product-card').first().within(() => {
      cy.get('button.btn-add').click()
    })

    // Ir al carrito
    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click()
    cy.url().should('include', '/cotizacion')

    // ==========================================
    // 3. GENERAR COTIZACIÓN (MOCKEADO PARA NO CREAR BASURA)
    // ==========================================
    cy.log('--- Paso 3: Generar Cotización (Mock) ---')
    
    // Mockeamos la petición POST para evitar llenar la BD real con basura
    cy.intercept('POST', `${apiUrl}/cotizaciones`, {
      statusCode: 201,
      body: {
        id_cotizacion: 9999, // ID Ficticio
        fecha: new Date().toISOString(),
        estado: 'Pendiente',
        total: 150000
      }
    }).as('crearCotizacionMock')

    // Confirmar cotización
    cy.get('button.btn-confirmar').click()
    
    // Esperar y verificar el mock
    cy.wait('@crearCotizacionMock')

    // Verificar el mensaje de éxito en la UI
    cy.get('.cotizacion-exito', { timeout: 15000 })
      .should('be.visible')
      .and('contain', '¡Cotización creada exitosamente!')

    // ==========================================
    // 4. CONSULTAR HISTORIAL DE COTIZACIONES
    // ==========================================
    cy.log('--- Paso 4: Revisar Historial de Cotizaciones ---')
    cy.visit(`${baseUrl}/mis-cotizaciones`)
    cy.url({ timeout: 10000 }).should('include', '/mis-cotizaciones')

    // Verificar que la vista cargue correctamente
    cy.get('.perfil-container', { timeout: 10000 }).should('be.visible')
    cy.get('.perfil-header h2').should('contain', 'Mis Cotizaciones')

    // ==========================================
    // 5. CERRAR SESIÓN
    // ==========================================
    cy.log('--- Paso 5: Cerrar Sesión ---')
    // Asumiendo que hay un botón de cerrar sesión en el nav
    cy.get('nav').contains('Cerrar sesión').click({ force: true })
    cy.url().should('include', '/login')
  })
})

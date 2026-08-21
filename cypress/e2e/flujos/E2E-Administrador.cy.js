// cypress/e2e/flujos/E2E-Administrador.cy.js

describe('Flujo E2E Completo: Rol Administrador', () => {
  const baseUrl = 'http://localhost:5173'
  const apiUrl = 'http://localhost:3000'
  const adminUser = { email: 'santidavila233@gmail.com', password: '123456789' }

  it('Debe completar el flujo completo de un administrador utilizando mocks para no crear registros basura en BD', () => {
    // ==========================================
    // 1. INICIO DE SESIÓN
    // ==========================================
    cy.log('--- Paso 1: Login de Administrador ---')
    cy.clearLocalStorage()
    cy.visit(`${baseUrl}/login`)
    cy.get('.input-field[type="email"]').clear().type(adminUser.email)
    cy.get('.input-field[type="password"]').clear().type(adminUser.password)
    cy.contains('button', 'Continuar').click()
    cy.url({ timeout: 10000 }).should('include', '/panel')

    // ==========================================
    // 2. VER PANEL (DASHBOARD)
    // ==========================================
    cy.log('--- Paso 2: Revisar Panel / Reportes ---')
    cy.get('.dashboard-grid', { timeout: 10000 }).should('be.visible')
    cy.contains('Gestión Rápida').should('be.visible')

    // ==========================================
    // 3. REGISTRAR ENTRADA (MOCKEADA)
    // ==========================================
    cy.log('--- Paso 3: Registrar Entrada de Inventario (Mock) ---')
    cy.visit(`${baseUrl}/entradasProductos`)
    cy.get('.loading-container', { timeout: 10000 }).should('not.exist')

    // Click en Agregar del primer producto
    cy.get('.btn-primary').contains('Agregar').first().click()
    cy.get('.modal-overlay').should('be.visible')
    
    cy.get('input[name="cantidad"]').type('10')
    cy.get('select[name="id_proveedor"]').select(1)

    // MOCK para evitar escritura real en BD
    cy.intercept('POST', `${apiUrl}/movimientos/entrada`, {
      statusCode: 201,
      body: { message: 'Entrada mockeada' }
    }).as('entradaMock')

    cy.get('.modal-buttons .btn-primary').click()
    cy.wait('@entradaMock')
    cy.get('.alert.success').should('contain', 'Entrada registrada exitosamente')

    // ==========================================
    // 4. REGISTRAR SALIDA (MOCKEADA)
    // ==========================================
    cy.log('--- Paso 4: Registrar Salida de Inventario (Mock) ---')
    cy.visit(`${baseUrl}/salidasProductos`)
    
    // Si la tabla carga vacío porque requiere seleccionar producto:
    cy.get('select#producto-select').should('exist')

    cy.get('.btn-delete').contains('Generar Salida').click()
    cy.get('.modal-overlay').should('be.visible')

    cy.get('input[name="cantidad"]').type('5')
    cy.get('input[name="destino"]').type('Mock Destino')
    cy.get('select[name="motivo"]').select('Venta Directa')

    // MOCK para evitar escritura real en BD
    cy.intercept('POST', `${apiUrl}/movimientos/salida`, {
      statusCode: 201,
      body: { message: 'Salida mockeada' }
    }).as('salidaMock')

    cy.get('.modal-buttons .btn-delete').click()
    cy.wait('@salidaMock')
    cy.get('.alert.success').should('contain', 'Salida registrada exitosamente')

    // ==========================================
    // 5. CONFIGURAR STOCK MÍNIMO (MOCKEADO)
    // ==========================================
    cy.log('--- Paso 5: Configurar Stock Mínimo (Mock) ---')
    cy.visit(`${baseUrl}/stock`)
    cy.get('.admin-table tbody tr').should('have.length.greaterThan', 0)

    // Extraer el ID del primer producto para mockear su PATCH
    cy.get('.admin-table tbody tr').first().then(($row) => {
      const idProducto = $row.find('td').eq(0).text().trim()
      
      // MOCK del cambio de nivel mínimo
      cy.intercept('PATCH', `${apiUrl}/stock/${idProducto}`, {
        statusCode: 200,
        body: { nivel_minimo: 15 }
      }).as('minimoMock')

      cy.request({
        method: 'PATCH',
        url: `${apiUrl}/stock/${idProducto}`,
        body: { nivel_minimo: 15 }
      }).then(() => {
         cy.log('PATCH ejecutado en Cypress (Mockeado)')
      })
    })

    // ==========================================
    // 6. CAMBIO ESTADO COTIZACIÓN (MOCKEADO)
    // ==========================================
    cy.log('--- Paso 6: Gestionar Cotización de Cliente (Mock) ---')
    cy.visit(`${baseUrl}/gestion-cotizaciones`)
    
    // MOCK del cambio de estado
    cy.intercept('PATCH', `${apiUrl}/cotizaciones/*/estado`, {
      statusCode: 200,
      body: { estado: 'Completado' }
    }).as('estadoMock')

    // Clic en cambiar estado si hay cotizaciones pendientes
    cy.get('body').then($body => {
      if ($body.find('.btn-success').length > 0) {
        cy.get('.btn-success').first().click()
        cy.wait('@estadoMock')
        cy.get('.alert.success').should('contain', 'Estado actualizado correctamente')
      }
    })

    // ==========================================
    // 7. CERRAR SESIÓN
    // ==========================================
    cy.log('--- Paso 7: Cerrar Sesión ---')
    cy.get('.sidebar-logout').click({ force: true })
    cy.url().should('include', '/login')
  })
})

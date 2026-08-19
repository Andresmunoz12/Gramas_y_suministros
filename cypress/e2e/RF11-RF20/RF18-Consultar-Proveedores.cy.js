// cypress/e2e/RF11-RF20/RF18-Consultar-Proveedores.cy.js

describe('RF-018: Consultar Listado de Proveedores', () => {
  const baseUrl = 'http://localhost:5173'
  const adminUser = { email: 'santidavila233@gmail.com', password: '123456789' }

  // ============================================================
  // CP-121: Verificar consulta exitosa del listado de proveedores
  // ============================================================
  it('CP-121: Debe consultar el listado de proveedores exitosamente', () => {
    // 1. Login como admin
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    // 2. Ir a Proveedores
    cy.contains('Proveedores', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
    
    // 3. Verificar que la tabla de proveedores está visible
    cy.get('.table-section', { timeout: 30000 }).should('be.visible')
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)
    
    // 4. Verificar que los proveedores tienen información
    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().within(() => {
      cy.get('td').should('have.length.greaterThan', 0)
    })
  })

  // ============================================================
  // CP-124: Verificar registrar entrada cuando no existen proveedores registrados
  // ============================================================
  it('CP-124: No debe permitir registrar entrada sin seleccionar proveedor', () => {
    // 1. Login como admin
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    // 2. Ir a Stock
    cy.contains('Stock', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/stock')
    cy.get('.table-section', { timeout: 30000 }).should('be.visible')
    
    // 3. Hacer clic en "Nueva Entrada"
    cy.get('.btn-primary', { timeout: 30000 }).contains('Nueva Entrada').click()
    cy.url({ timeout: 30000 }).should('include', '/entradasProductos')
    
    // 4. Hacer clic en "Agregar" para abrir el modal
    cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar').click()
    
    // 5. El modal debe estar visible
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')
    
    // 6. Llenar solo la cantidad, dejar proveedor vacío
    cy.get('input[name="cantidad"]', { timeout: 30000 }).type('10')
    // No seleccionar proveedor (queda en "Seleccione un proveedor")
    
    // 7. Intentar guardar
    cy.get('.modal-buttons .btn-primary', { timeout: 30000 }).click()
    
    // 8. Verificar que el campo proveedor tiene required (validación HTML5)
    cy.get('select[name="id_proveedor"]', { timeout: 30000 }).should('have.attr', 'required')
    
    // 9. Verificar que el modal sigue abierto (no se envió)
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')
    
    // 10. Verificar que NO hay mensaje de éxito
    cy.get('.alert.success', { timeout: 30000 }).should('not.exist')
  })
})
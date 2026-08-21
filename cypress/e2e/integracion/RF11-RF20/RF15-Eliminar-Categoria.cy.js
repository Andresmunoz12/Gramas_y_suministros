// cypress/e2e/RF11-RF20/RF15-Eliminar-Categoria.cy.js

describe('RF-015: Eliminar Categoría de Producto', () => {
  const baseUrl = 'http://localhost:5173'
  
  const adminUser = {
    email: 'santidavila233@gmail.com',
    password: '123456789'
  }

  // ============================================================
  // CP-100: Verificar eliminación exitosa de una categoría sin productos asociados
  // ============================================================
  it('CP-100: Debe eliminar una categoría sin productos exitosamente', () => {
    // 1. Login como admin
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    // 2. Ir a Categorías
    cy.contains('Categorías', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/categorias')
    cy.get('.table-section', { timeout: 30000 }).should('be.visible')
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)

    // 3. Buscar categoría sin productos (columna 4, índice 3 = 0)
    cy.get('.admin-table tbody tr', { timeout: 30000 }).each(($row) => {
      cy.wrap($row).find('td').eq(3).then(($productosTd) => {
        if (parseInt($productosTd.text().trim()) === 0) {
          cy.wrap($row).find('.btn-delete').scrollIntoView().click({ force: true })
        }
      })
    })

    // 4. Stub para el confirm y el alert
    cy.on('window:confirm', () => true)
    cy.on('window:alert', (text) => {
      expect(text).to.contain('eliminada correctamente')
    })

    // 5. Verificar que la categoría ya no está en la tabla
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)
  })

  // ============================================================
  // CP-101: Verificar intentar eliminar una categoría con productos asociados
  // ============================================================
  it('CP-101: No debe permitir eliminar una categoría con productos asociados', () => {
    // 1. Login como admin
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    // 2. Ir a Categorías
    cy.contains('Categorías', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/categorias')
    cy.get('.table-section', { timeout: 30000 }).should('be.visible')
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)

    // 3. Buscar categoría con productos (columna 4, índice 3 > 0)
    cy.get('.admin-table tbody tr', { timeout: 30000 }).each(($row) => {
      cy.wrap($row).find('td').eq(3).then(($productosTd) => {
        if (parseInt($productosTd.text().trim()) > 0) {
          cy.wrap($row).find('.btn-delete').scrollIntoView().click({ force: true })
        }
      })
    })

    // 4. Confirmar eliminación
    cy.on('window:confirm', () => true)

    // 5. Verificar mensaje de error (alert)
    cy.on('window:alert', (text) => {
      expect(text).to.contain('No se puede eliminar')
    })
  })

  // ============================================================
  // CP-104: Verificar que solo un administrador pueda eliminar categorías
  // ============================================================
  it('CP-104: Debe restringir el acceso a usuarios no administradores', () => {
    // 1. Login como admin
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')

    // 2. Cerrar sesión - redirige a /login
    cy.contains('Cerrar Sesión', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/login')

    // 3. Login como cliente
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type('marlon123@gmail.com')
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type('12345678')
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('eq', `${baseUrl}/`)

    // 4. Intentar acceder a categorías
    cy.visit(`${baseUrl}/categorias`, { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('not.include', '/categorias')
  })
})
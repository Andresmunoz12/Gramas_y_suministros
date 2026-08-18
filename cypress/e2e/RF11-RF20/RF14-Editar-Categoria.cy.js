// cypress/e2e/RF11-RF20/RF14-Editar-Categoria.cy.js

describe('RF-014: Modificar Categoría de Producto', () => {
  const baseUrl = 'http://localhost:5173'

  // ============================================================
  // CP-093: Verificar modificación exitosa de categoría
  // ============================================================
  it('CP-093: Debe modificar una categoría exitosamente', () => {
    // 1. Login como admin
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type('santidavila233@gmail.com')
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type('123456789')
    cy.contains('button', 'Continuar').click()
    cy.url({ timeout: 30000 }).should('include', '/panel')

    // 2. Ir a Categorías
    cy.contains('Categorías', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/categorias')

    // 3. Editar primera categoría
    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().within(() => {
      cy.get('.btn-extra').contains('Editar').scrollIntoView().click({ force: true })
    })
    cy.url({ timeout: 30000 }).should('include', '/editar-categoria')

    // 4. Cambiar nombre
    cy.get('input[name="nombre"]', { timeout: 30000 }).clear().type('Deportiva Editada')

    // 5. Guardar
    cy.get('.btn-submit', { timeout: 30000 }).click()

    // 6. Verificar éxito
    cy.get('.alert.success', { timeout: 30000 }).should('be.visible').and('contain', '¡Categoría actualizada exitosamente!')
  })

  // ============================================================
  // CP-094: Verificar intentar modificar una categoría con un nombre duplicado
  // ============================================================
  it('CP-094: No debe permitir modificar con un nombre duplicado', () => {
    // 1. Login como admin
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type('santidavila233@gmail.com')
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type('123456789')
    cy.contains('button', 'Continuar').click()
    cy.url({ timeout: 30000 }).should('include', '/panel')

    // 2. Ir a Categorías
    cy.contains('Categorías', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/categorias')

    // 3. Editar primera categoría
    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().within(() => {
      cy.get('.btn-extra').contains('Editar').scrollIntoView().click({ force: true })
    })
    cy.url({ timeout: 30000 }).should('include', '/editar-categoria')

    // 4. Poner nombre "Residencial" (que ya existe)
    cy.get('input[name="nombre"]', { timeout: 30000 }).clear().type('Residencial')
   
    // 5. Guardar
    cy.get('.btn-submit', { timeout: 30000 }).click()

    // 6. Verificar error
    cy.get('.alert.error', { timeout: 30000 }).should('be.visible')
  })

  // ============================================================
  // CP-095: Verificar campos obligatorios vacíos
  // ============================================================
  it('CP-095: Debe mostrar error al dejar campos obligatorios vacíos', () => {
    // 1. Login como admin
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type('santidavila233@gmail.com')
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type('123456789')
    cy.contains('button', 'Continuar').click()
    cy.url({ timeout: 30000 }).should('include', '/panel')

    // 2. Ir a Categorías
    cy.contains('Categorías', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/categorias')

    // 3. Editar primera categoría
    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().within(() => {
      cy.get('.btn-extra').contains('Editar').scrollIntoView().click({ force: true })
    })
    cy.url({ timeout: 30000 }).should('include', '/editar-categoria')

    // 4. Vaciar campos
    cy.get('input[name="nombre"]', { timeout: 30000 }).clear()
    cy.get('textarea[name="descripcion"]', { timeout: 30000 }).clear()

    // 5. Intentar enviar
    cy.get('.btn-submit', { timeout: 30000 }).click()

    // 6. Verificar que el campo tiene required
    cy.get('input[name="nombre"]', { timeout: 30000 }).should('have.attr', 'required')
    
    // 7. Verificar que NO se envió
    cy.url({ timeout: 30000 }).should('include', '/editar-categoria')
    cy.get('.alert.success', { timeout: 30000 }).should('not.exist')
  })


  // ============================================================
  // CP-097: Verificar que solo un administrador pueda modificar categorías
  // ============================================================
  it('CP-097: Debe restringir el acceso a usuarios no administradores', () => {
    // 1. Login como admin
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type('santidavila233@gmail.com')
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type('123456789')
    cy.contains('button', 'Continuar').click()
    cy.url({ timeout: 30000 }).should('include', '/panel')

    // 2. Cerrar sesión del admin - redirige a / (catálogo)
    cy.contains('Cerrar Sesión', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('eq', `${baseUrl}/`)

    // 3. Ir a login manualmente
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })

    // 4. Login como cliente (rol no autorizado)
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type('marlon123@gmail.com')
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type('12345678')
    cy.contains('button', 'Continuar').click()
    // Cliente redirige a / (catálogo)
    cy.url({ timeout: 30000 }).should('eq', `${baseUrl}/`)

    // 5. Intentar editar categoría (debería redirigir)
    cy.visit(`${baseUrl}/editar-categoria/1`, { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('not.include', '/editar-categoria')
  })
})
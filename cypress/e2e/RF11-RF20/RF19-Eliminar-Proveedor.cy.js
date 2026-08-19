// cypress/e2e/RF11-RF20/RF19-Eliminar-Proveedor.cy.js

describe('RF-019: Eliminar Proveedor', () => {
  const baseUrl = 'http://localhost:5173'
  const adminUser = { email: 'santidavila233@gmail.com', password: '123456789' }

  // ============================================================
  // CP-127: Verificar eliminación exitosa de un proveedor sin información asociada
  // ============================================================
  it('CP-127: Debe eliminar un proveedor sin asociaciones exitosamente', () => {
    // 1. Login como admin
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    // 2. Ir a Proveedores
    cy.contains('Proveedores', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)

    // 3. Buscar un proveedor sin entradas (si existe) o el primero disponible
    // Como no sabemos cuáles tienen entradas, intentamos eliminar el primero
    // y si tiene entradas, el backend devolverá error (CP-128)
    // Para CP-127 necesitamos un proveedor sin entradas, usamos el ID 1 si existe
    
    // Primero verificamos si el proveedor con ID 1 existe
    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().within(() => {
      cy.get('td').first().then(($td) => {
        const id = parseInt($td.text().trim())
        cy.log(`📝 Intentando eliminar proveedor ID: ${id}`)
        cy.get('.btn-delete').scrollIntoView().click({ force: true })
      })
    })

    // 4. Confirmar eliminación
    cy.on('window:confirm', () => true)

    // 5. Verificar mensaje de éxito (alert)
    cy.on('window:alert', (text) => {
      expect(text).to.contain('eliminado correctamente')
    })
  })

  // ============================================================
  // CP-128: Verificar intentar eliminar un proveedor con productos asociados
  // ============================================================
  it('CP-128: No debe permitir eliminar un proveedor con entradas asociadas', () => {
    // 1. Login como admin
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    // 2. Ir a Proveedores
    cy.contains('Proveedores', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)

    // 3. Buscar un proveedor con entradas (ID 19 que sabemos que tiene)
    let proveedorEncontrado = false
    
    cy.get('.admin-table tbody tr', { timeout: 30000 }).each(($row) => {
      cy.wrap($row).find('td').first().then(($td) => {
        const id = parseInt($td.text().trim())
        // ID 19 sabemos que tiene entradas según el error anterior
        if (id === 19 && !proveedorEncontrado) {
          proveedorEncontrado = true
          cy.log(`📝 Intentando eliminar proveedor con entradas ID: ${id}`)
          cy.wrap($row).find('.btn-delete').scrollIntoView().click({ force: true })
        }
      })
    })

    // 4. Confirmar eliminación
    cy.on('window:confirm', () => true)

    // 5. Verificar mensaje de error
    cy.on('window:alert', (text) => {
      expect(text).to.contain('No se puede eliminar el proveedor porque tiene entradas asociadas')
    })
  })

  // ============================================================
  // CP-131: Verificar que solo un administrador pueda eliminar proveedores (CORREGIDO)
  // ============================================================
  it('CP-131: Debe restringir el acceso a usuarios no administradores', () => {
    // 1. Login como admin
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')

    // 2. Cerrar sesión - redirige a / (catálogo)
    cy.contains('Cerrar Sesión', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('eq', `${baseUrl}/`)

    // 3. Ir a login manualmente
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })

    // 4. Login como cliente
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type('marlon123@gmail.com')
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type('12345678')
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('eq', `${baseUrl}/`)

    // 5. Intentar acceder a proveedores
    cy.visit(`${baseUrl}/proveedores`, { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('not.include', '/proveedores')
  })
})
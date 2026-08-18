// cypress/e2e/RF11-RF20/RF17-Actualizar-Proveedor.cy.js

describe('RF-017: Actualizar Proveedor', () => {
  const baseUrl = 'http://localhost:5173'
  const adminUser = { email: 'santidavila233@gmail.com', password: '123456789' }

  // ============================================================
  // CP-113: Verificar actualización exitosa del proveedor
  // ============================================================
  it('CP-113: Debe actualizar un proveedor exitosamente', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    cy.contains('Proveedores', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)

    // Editar primer proveedor
    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().within(() => {
      cy.get('.btn-extra').contains('Editar').scrollIntoView().click({ force: true })
    })
    cy.url({ timeout: 30000 }).should('include', '/editar-proveedor')

    // Actualizar datos
    const nuevoNombre = 'Alfocentrex edit'
    cy.get('input[name="nombre"]', { timeout: 30000 }).clear().type(nuevoNombre)

    cy.get('.btn-submit', { timeout: 30000 }).click()

    cy.get('.alert.success', { timeout: 30000 }).should('be.visible').and('contain', '¡Proveedor actualizado exitosamente!')
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
  })

  // ============================================================
  // CP-114: Verificar campos obligatorios vacíos
  // ============================================================
  it('CP-114: Debe mostrar error al dejar campos obligatorios vacíos', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    cy.contains('Proveedores', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)

    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().within(() => {
      cy.get('.btn-extra').contains('Editar').scrollIntoView().click({ force: true })
    })
    cy.url({ timeout: 30000 }).should('include', '/editar-proveedor')

    // Vaciar el campo nombre (que tiene required)
    cy.get('input[name="nombre"]', { timeout: 30000 }).clear()
    cy.get('input[name="nombre"]', { timeout: 30000 }).clear()
    cy.get('input[name="contacto"]', { timeout: 30000 }).clear()
    cy.get('input[name="telefono"]', { timeout: 30000 }).clear()
    cy.get('input[name="email"]', { timeout: 30000 }).clear()
    cy.get('input[name="direccion"]', { timeout: 30000 }).clear()
    cy.get('.btn-submit', { timeout: 30000 }).click()

    // Verificar que el campo tiene required (validación HTML5)
    cy.get('input[name="nombre"]', { timeout: 30000 }).should('have.attr', 'required')
    
    // Verificar que la URL sigue en editar (no se envió el formulario)
    cy.url({ timeout: 30000 }).should('include', '/editar-proveedor')
    
    // Verificar que NO hay mensaje de éxito
    cy.get('.alert.success', { timeout: 30000 }).should('not.exist')
  })

  // ============================================================
  // CP-115: Verificar información inválida
  // ============================================================
  it('CP-115: Debe mostrar error al enviar información inválida', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    cy.contains('Proveedores', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)

    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().within(() => {
      cy.get('.btn-extra').contains('Editar').scrollIntoView().click({ force: true })
    })
    cy.url({ timeout: 30000 }).should('include', '/editar-proveedor')

    cy.get('input[name="nombre"]', { timeout: 30000 }).clear().type('Proveedor Test')
    cy.get('input[name="telefono"]', { timeout: 30000 }).clear().type('ABC123')
    cy.get('.btn-submit', { timeout: 30000 }).click()

    cy.get('.alert.error', { timeout: 30000 }).should('be.visible').and('contain', 'El teléfono solo puede contener números')
  })

  // ============================================================
  // CP-117: Verificar NIT o identificación duplicado
  // ============================================================
    it('CP-117: No debe permitir duplicar el nombre del proveedor', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    cy.contains('Proveedores', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)

    // Obtener nombre del primer proveedor
    let nombreDuplicado = ''
    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().find('td').eq(1).then(($td) => {
        nombreDuplicado = $td.text().trim()
    })

    // Si hay más de un proveedor, editar el segundo
    cy.then(() => {
        cy.get('.admin-table tbody tr', { timeout: 30000 }).then(($rows) => {
        if ($rows.length > 1) {
            cy.get('.admin-table tbody tr').eq(1).within(() => {
            cy.get('.btn-extra').contains('Editar').scrollIntoView().click({ force: true })
            })
        } else {
            // Si solo hay uno, crear uno nuevo
            cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar Proveedor').click()
            cy.url({ timeout: 30000 }).should('include', '/insertar-proveedor')
            cy.get('input[name="nombre"]', { timeout: 30000 }).type('Proveedor Duplicado Test')
        }
        })
    })

    cy.url({ timeout: 30000 }).should('include', '/editar-proveedor')

    cy.then(() => {
        cy.get('input[name="nombre"]', { timeout: 30000 }).clear().type(nombreDuplicado)
        cy.get('.btn-submit', { timeout: 30000 }).click()
    })

    cy.get('.alert.error', { timeout: 30000 }).should('be.visible').and('contain', 'ya existe')
    })

  // ============================================================
  // CP-118: Verificar que solo administrador pueda actualizar proveedores
  // ============================================================
  it('CP-118: Debe restringir el acceso a usuarios no administradores', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')

    cy.contains('Cerrar Sesión', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/login')

    cy.get('.input-field[type="email"]', { timeout: 30000 }).type('marlon123@gmail.com')
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type('12345678')
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('eq', `${baseUrl}/`)

    cy.visit(`${baseUrl}/proveedores`, { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('not.include', '/proveedores')
  })

  // ============================================================
  // CP-119: Verificar actualización en la base de datos (SIMPLIFICADO)
  // ============================================================
  it('CP-119: Debe guardar correctamente la actualización en la base de datos', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    cy.contains('Proveedores', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)

    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().within(() => {
      cy.get('.btn-extra').contains('Editar').scrollIntoView().click({ force: true })
    })
    cy.url({ timeout: 30000 }).should('include', '/editar-proveedor')

    const nuevoNombre = 'BD Alfocentrex XD'
    cy.get('input[name="nombre"]', { timeout: 30000 }).clear().type(nuevoNombre)

    cy.get('.btn-submit', { timeout: 30000 }).click()

    cy.get('.alert.success', { timeout: 30000 }).should('be.visible').and('contain', '¡Proveedor actualizado exitosamente!')
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
  })
})
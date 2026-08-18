// cypress/e2e/RF11-RF20/RF16-Registrar-Proveedor.cy.js

describe('RF-016: Registrar Proveedor', () => {
  const baseUrl = 'http://localhost:5173'
  const adminUser = { email: 'santidavila233@gmail.com', password: '123456789' }

  // ============================================================
  // CP-106: Verificar registro exitoso de proveedor
  // ============================================================
  it('CP-106: Debe registrar un proveedor exitosamente', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    cy.contains('Proveedores', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
    
    cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar Proveedor').click()
    cy.url({ timeout: 30000 }).should('include', '/insertar-proveedor')

    const nombreProveedor = 'Proveedor Test'
    cy.get('input[name="nombre"]', { timeout: 30000 }).type(nombreProveedor)
    cy.get('input[name="contacto"]', { timeout: 30000 }).type('Juan Pérez')
    cy.get('input[name="telefono"]', { timeout: 30000 }).type('3001234567')
    cy.get('input[name="email"]', { timeout: 30000 }).type('test@proveedor.com')
    cy.get('input[name="direccion"]', { timeout: 30000 }).type('Calle 10 #45-12, Bogotá')

    cy.get('.btn-submit', { timeout: 30000 }).click()
    cy.get('.alert.success', { timeout: 30000 }).should('be.visible').and('contain', '¡Proveedor creado exitosamente!')
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
  })

  // ============================================================
  // CP-108: Verificar campos obligatorios vacíos
  // ============================================================
  it('CP-108: Debe mostrar error al dejar campos obligatorios vacíos', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    cy.contains('Proveedores', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
    
    cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar Proveedor').click()
    cy.url({ timeout: 30000 }).should('include', '/insertar-proveedor')

    cy.get('input[name="nombre"]', { timeout: 30000 }).clear()
    cy.get('.btn-submit', { timeout: 30000 }).click()

    cy.get('input[name="nombre"]', { timeout: 30000 }).should('have.attr', 'required')
    cy.get('input[name="nombre"]:invalid', { timeout: 30000 }).should('exist')
    cy.url({ timeout: 30000 }).should('include', '/insertar-proveedor')
    cy.get('.alert.success', { timeout: 30000 }).should('not.exist')
  })

  // ============================================================
  // CP-109: Verificar información inválida
  // ============================================================
  it('CP-109: Debe mostrar error al enviar información inválida', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    cy.contains('Proveedores', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
    
    cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar Proveedor').click()
    cy.url({ timeout: 30000 }).should('include', '/insertar-proveedor')

    cy.get('input[name="nombre"]', { timeout: 30000 }).type('Proveedor Test')
    cy.get('input[name="telefono"]', { timeout: 30000 }).type('ABC123')
    cy.get('.btn-submit', { timeout: 30000 }).click()

    cy.get('.alert.error', { timeout: 30000 }).should('be.visible').and('contain', 'El teléfono solo puede contener números')
  })

  // ============================================================
  // CP-110: Verificar que solo administrador pueda registrar proveedores
  // ============================================================
  it('CP-110: Debe restringir el acceso a usuarios no administradores', () => {
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
  // CP-111: Verificar almacenamiento correcto en la base de datos
  // ============================================================
  it('CP-111: Debe guardar correctamente el proveedor en la base de datos', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    cy.contains('Proveedores', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
    
    cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar Proveedor').click()
    cy.url({ timeout: 30000 }).should('include', '/insertar-proveedor')

    const nombreProveedor = 'BD Test Proveedor'
    const email = 'test@proveedor.com'

    cy.get('input[name="nombre"]', { timeout: 30000 }).type(nombreProveedor)
    cy.get('input[name="contacto"]', { timeout: 30000 }).type('Juan Pérez')
    cy.get('input[name="telefono"]', { timeout: 30000 }).type('3001234567')
    cy.get('input[name="email"]', { timeout: 30000 }).type(email)
    cy.get('input[name="direccion"]', { timeout: 30000 }).type('Calle 10 #45-12, Bogotá')

    cy.intercept('POST', 'http://localhost:3000/proveedores').as('createProveedor')
    cy.get('.btn-submit', { timeout: 30000 }).click()

    cy.wait('@createProveedor', { timeout: 30000 }).then((interception) => {
      expect(interception.request.body).to.have.property('nombre', nombreProveedor)
      expect(interception.request.body).to.have.property('contacto', 'Juan Pérez')
      expect(interception.request.body).to.have.property('telefono', '3001234567')
      expect(interception.request.body).to.have.property('email', email)
      expect(interception.request.body).to.have.property('direccion', 'Calle 10 #45-12, Bogotá')
      expect(interception.response.statusCode).to.equal(201)
    })

    cy.get('.alert.success', { timeout: 30000 }).should('be.visible').and('contain', '¡Proveedor creado exitosamente!')
    cy.url({ timeout: 30000 }).should('include', '/proveedores')
  })
})
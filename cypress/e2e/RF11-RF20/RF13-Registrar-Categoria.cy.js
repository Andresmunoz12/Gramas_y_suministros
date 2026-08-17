// cypress/e2e/RF11-RF20/RF13-Registrar-Categoria.cy.js

describe('RF-013: Registrar Categoría de Producto', () => {
  const baseUrl = 'http://localhost:5173'
  
  // Credenciales de admin
  const adminUser = {
    email: 'santidavila233@gmail.com',
    password: '123456789'
  }

  // Credenciales de cliente
  const clientUser = {
    email: 'marlon123@gmail.com',
    password: '12345678'
  }

  // Función para login como admin
  const loginAsAdmin = () => {
    cy.visit(`${baseUrl}/login`)
    cy.get('.input-field[type="email"]').type(adminUser.email)
    cy.get('.input-field[type="password"]').type(adminUser.password)
    cy.contains('button', 'Continuar').click()
    cy.url({ timeout: 10000 }).should('include', '/panel')
  }

  // Función para login como cliente
  const loginAsClient = () => {
    cy.visit(`${baseUrl}/login`)
    cy.get('.input-field[type="email"]').type(clientUser.email)
    cy.get('.input-field[type="password"]').type(clientUser.password)
    cy.contains('button', 'Continuar').click()
    cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`)
  }

  // Función para navegar a la página de categorías
  const goToCategorias = () => {
    cy.get('aside.sidebar').should('be.visible')
    cy.get('aside.sidebar nav button').contains('Categorías').click()
    cy.url().should('include', '/categorias')
    cy.get('.table-section').should('be.visible')
  }

  // Función para ir al formulario de insertar categoría
  const goToInsertarCategoria = () => {
    cy.get('.btn-primary').contains('Agregar Categoría').click()
    cy.url().should('include', '/insertar-categoria')
    cy.get('.insert-container').should('be.visible')
  }

  // Función para llenar el formulario de categoría
  const fillCategoriaForm = (nombre, descripcion) => {
    cy.get('input[name="nombre"]').clear().type(nombre)
    cy.get('textarea[name="descripcion"]').clear().type(descripcion)
  }

  beforeEach(() => {
    loginAsAdmin()
    goToCategorias()
  })

  // ============================================================
  // CP-086: Verificar registro exitoso de categoría
  // ============================================================
  it('CP-086: Debe registrar una categoría exitosamente', () => {
    goToInsertarCategoria()

    const nombreCategoria = `Categoria Test ${Date.now()}`
    const descripcion = `Descripción de ${nombreCategoria}`

    fillCategoriaForm(nombreCategoria, descripcion)
    cy.get('.btn-submit').click()

    cy.get('.alert.success').should('be.visible').and('contain', '¡Categoría creada exitosamente!')
    cy.url({ timeout: 5000 }).should('include', '/categorias')
    cy.get('.admin-table tbody tr').should('contain', nombreCategoria)
  })

  // ============================================================
  // CP-087: Verificar intentar registrar una categoría duplicada
  // ============================================================
  it('CP-087: No debe permitir registrar una categoría duplicada', () => {
    let nombreExistente = ''

    cy.get('.admin-table tbody tr').first().within(() => {
      cy.get('td').eq(1).then(($td) => {
        nombreExistente = $td.text().trim()
      })
    })

    goToInsertarCategoria()

    cy.then(() => {
      fillCategoriaForm(nombreExistente, 'Descripción duplicada')
    })

    cy.get('.btn-submit').click()
    cy.get('.alert.error').should('be.visible').and('contain', 'ya existe')
  })

  // ============================================================
  // CP-088: Verificar campos obligatorios vacíos
  // ============================================================
  it('CP-088: Debe mostrar error al dejar campos obligatorios vacíos', () => {
    goToInsertarCategoria()

    cy.get('input[name="nombre"]').clear()
    cy.get('textarea[name="descripcion"]').clear()

    cy.get('.btn-submit').click()

    // Verificar validación HTML5
    cy.get('input[name="nombre"]').then(($input) => {
      expect($input[0]).to.have.attr('required')
    })

    cy.get('input[name="nombre"]:invalid').should('exist')
    cy.url().should('include', '/insertar-categoria')
    cy.get('.alert.success').should('not.exist')
  })

  // ============================================================
  // CP-089: Verificar información inválida
  // ============================================================
  it('CP-089: Debe mostrar error al enviar información inválida', () => {
    goToInsertarCategoria()

    fillCategoriaForm('AB', 'Descripción válida')

    cy.get('.btn-submit').click()
    cy.get('.alert.error').should('be.visible').and('contain', 'al menos 3 caracteres')
  })

  // ============================================================
  // CP-090: Verificar que solo administrador pueda registrar categorías (CORREGIDO)
  // ============================================================
  it('CP-090: Debe restringir el acceso a usuarios no administradores', () => {
    // 1. Cerrar sesión del admin
    cy.get('aside.sidebar nav button').contains('Cerrar Sesión').click()
    
    // 2. Verificar que redirige a login (no a /)
    cy.url({ timeout: 5000 }).should('include', '/login')

    // 3. Iniciar sesión como cliente
    cy.get('.input-field[type="email"]').type(clientUser.email)
    cy.get('.input-field[type="password"]').type(clientUser.password)
    cy.contains('button', 'Continuar').click()
    cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`)

    // 4. Intentar acceder directamente a la página de categorías
    cy.visit(`${baseUrl}/categorias`)

    // 5. Verificar que es redirigido (no puede acceder a categorías)
    cy.url().should('not.include', '/categorias')
  })

  // ============================================================
  // CP-091: Verificar almacenamiento correcto en la base de datos
  // ============================================================
  it('CP-091: Debe guardar correctamente la categoría en la base de datos', () => {
    goToInsertarCategoria()

    const nombreCategoria = `BD Test ${Date.now()}`
    const descripcion = `Descripción de ${nombreCategoria}`

    fillCategoriaForm(nombreCategoria, descripcion)

    cy.intercept('POST', 'http://localhost:3000/categorias').as('createCategoria')

    cy.get('.btn-submit').click()

    cy.wait('@createCategoria').then((interception) => {
      expect(interception.request.body).to.have.property('nombre', nombreCategoria)
      expect(interception.request.body).to.have.property('descripcion', descripcion)
      expect(interception.response.statusCode).to.equal(201)
    })

    cy.get('.alert.success').should('be.visible').and('contain', '¡Categoría creada exitosamente!')
    cy.url({ timeout: 5000 }).should('include', '/categorias')
    cy.get('.admin-table tbody tr').should('contain', nombreCategoria)
  })
})
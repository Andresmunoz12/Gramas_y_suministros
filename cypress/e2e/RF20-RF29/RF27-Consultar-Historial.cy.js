// cypress/e2e/RF20-RF29/RF27-Consultar-Historial.cy.js

describe('RF-027: Consultar Historial de Movimientos de Inventario', () => {
  const baseUrl = 'http://localhost:5173'
  const adminUser = { email: 'santidavila233@gmail.com', password: '123456789' }
  const clientUser = { email: 'marlon123@gmail.com', password: '12345678' }

  // ============================================================
  // Función reutilizable: Login esperando redirección según rol
  // ============================================================
  const login = (email, password, expectPanel = true) => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    
    if (expectPanel) {
      cy.url({ timeout: 30000 }).should('include', '/panel')
    } else {
      cy.url({ timeout: 30000 }).should('eq', `${baseUrl}/`)
    }
  }

  // ============================================================
  // CP-178: Consultar el historial con movimientos registrados
  // ============================================================
  it('CP-178: Debe cargar el historial de movimientos cuando existen registros', () => {
    login(adminUser.email, adminUser.password, true)
    cy.visit(`${baseUrl}/entradasProductos`, { timeout: 30000 })

    // Esperar que la tabla cargue y desaparezca el texto "Cargando..."
    cy.get('.table-container table tbody', { timeout: 30000 })
      .should('not.contain', 'Cargando')

    // Verificar que muestre filas en el historial
    cy.get('.table-container table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)
  })

  // ============================================================
  // CP-179: Consultar el historial cuando no existen movimientos
  // ============================================================
  it('CP-179: Debe mostrar mensaje correspondiente cuando el historial está vacío', () => {
    // Interceptar la API de movimientos en el puerto 3000
    cy.intercept('GET', 'http://localhost:3000/movimientos', { body: [] }).as('getEmptyMovements')

    login(adminUser.email, adminUser.password, true)
    cy.visit(`${baseUrl}/entradasProductos`, { timeout: 30000 })
    cy.wait('@getEmptyMovements')

    cy.get('.table-container table tbody', { timeout: 30000 })
      .should('not.contain', 'Cargando')

    // Verificar el mensaje de tabla vacía
    cy.get('.table-container table tbody tr td.empty', { timeout: 30000 })
      .should('be.visible')
      .and('contain', 'No hay entradas registradas')
  })

  // ============================================================
  // CP-180: Consultar el historial utilizando criterios de búsqueda sin resultados
  // ============================================================
  it('CP-180: Al elegir un producto sin movimientos, debe mostrar el mensaje de historial vacío', () => {
    // Interceptamos la petición para forzar que no haya movimientos
    cy.intercept('GET', 'http://localhost:3000/movimientos', { body: [] }).as('getZeroMovements')

    login(adminUser.email, adminUser.password, true)
    cy.visit(`${baseUrl}/entradasProductos`, { timeout: 30000 })
    cy.wait('@getZeroMovements')

    cy.get('.table-container table tbody', { timeout: 30000 })
      .should('not.contain', 'Cargando')

    // Al seleccionar cualquier producto de la lista, la tabla debe mostrar el mensaje vacío
    cy.get('select#producto-select', { timeout: 30000 }).select(1)
    
    cy.get('.table-container table tbody tr td.empty', { timeout: 30000 })
      .should('be.visible')
      .and('contain', 'No hay entradas registradas')
  })

  // ============================================================
  // CP-181: Verificar que la información mostrada incluya
  //         fecha, proveedor/destino, cantidad y observaciones/motivo
  // ============================================================
  it('CP-181: La tabla de historial de entradas debe tener las columnas correctas', () => {
    login(adminUser.email, adminUser.password, true)
    
    // --- Verificar en Entradas ---
    cy.visit(`${baseUrl}/entradasProductos`, { timeout: 30000 })
    cy.get('.table-container table thead tr', { timeout: 30000 }).within(() => {
      cy.get('th').eq(0).should('contain', 'Fecha')
      cy.get('th').eq(1).should('contain', 'Proveedor')
      cy.get('th').eq(2).should('contain', 'Cantidad')
      cy.get('th').eq(3).should('contain', 'Observaciones')
    })

    // --- Verificar en Salidas ---
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
    cy.get('.table-container table thead tr', { timeout: 30000 }).within(() => {
      cy.get('th').eq(0).should('contain', 'Fecha')
      cy.get('th').eq(1).should('contain', 'Destino')
      cy.get('th').eq(2).should('contain', 'Motivo')
      cy.get('th').eq(3).should('contain', 'Cantidad')
      cy.get('th').eq(4).should('contain', 'Observaciones')
    })
  })

  // ============================================================
  // CP-182: Verificar que solo un administrador pueda consultar el historial
  // ============================================================
  it('CP-182: Debe restringir el acceso al historial para no administradores', () => {
    // Iniciar sesión como cliente normal (redirigido a /)
    login(clientUser.email, clientUser.password, false)

    // Intentar visitar la página de entradas de producto directamente
    cy.visit(`${baseUrl}/entradasProductos`, { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('not.include', '/entradasProductos')

    // Intentar visitar la página de salidas de producto directamente
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('not.include', '/salidasProductos')
  })
})

/*
// CP-183: Simular un error de conexión con la base de datos.
//   -> No es posible con Cypress.
*/

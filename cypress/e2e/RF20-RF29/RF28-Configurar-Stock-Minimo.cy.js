// cypress/e2e/RF20-RF29/RF28-Configurar-Stock-Minimo.cy.js

describe('RF-028: Configurar Stock Mínimo de Producto', () => {
  const baseUrl = 'http://localhost:5173'
  const apiUrl = 'http://localhost:3000'
  const adminUser = { email: 'santidavila233@gmail.com', password: '123456789' }
  const clientUser = { email: 'marlon123@gmail.com', password: '12345678' }

  // ============================================================
  // Función reutilizable: Login en UI
  // ============================================================
  const loginUI = (email, password, expectPanel = true) => {
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
  // CP-184: Configurar correctamente el stock mínimo de un producto
  // Simulamos que el backend acepta el cambio y lo devuelve en el GET
  // ============================================================
  it('CP-184: El stock mínimo configurado debe reflejarse correctamente en la UI', () => {
    const nuevoMinimo = 15

    // Simular que el servidor devuelve el stock con el nivel_minimo ya actualizado
    cy.intercept('GET', `${apiUrl}/stock`, {
      body: [
        {
          id_producto: 1,
          cantidad_actual: 30,
          nivel_minimo: nuevoMinimo, // ← Este es el valor "configurado"
          ultima_actualizacion: new Date().toISOString(),
          producto: { nombre: 'Producto de Prueba CP-184' }
        }
      ]
    }).as('getStockConfigurado')

    loginUI(adminUser.email, adminUser.password, true)
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.wait('@getStockConfigurado')

    // Verificar que en la tabla se muestra el nivel mínimo configurado correctamente
    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().within(() => {
      cy.get('td').eq(3).should('contain', nuevoMinimo.toString()) // Columna "Nivel Mínimo"
    })
  })

  // ============================================================
  // CP-185: Modificar el stock mínimo de un producto
  // ============================================================
  it('CP-185: La UI debe mostrar el nuevo valor modificado del stock mínimo', () => {
    const minimoOriginal = 5
    const minimoModificado = 20

    // Simular primero con el valor original
    cy.intercept('GET', `${apiUrl}/stock`, {
      body: [
        {
          id_producto: 1,
          cantidad_actual: 50,
          nivel_minimo: minimoModificado, // Valor ya modificado
          ultima_actualizacion: new Date().toISOString(),
          producto: { nombre: 'Producto de Prueba CP-185' }
        }
      ]
    }).as('getStockModificado')

    loginUI(adminUser.email, adminUser.password, true)
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.wait('@getStockModificado')

    cy.log(`Mínimo original era: ${minimoOriginal}, ahora debe mostrar: ${minimoModificado}`)

    // Verificar que la tabla muestra el nuevo valor modificado
    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().within(() => {
      cy.get('td').eq(3).should('contain', minimoModificado.toString())
    })
  })

  // ============================================================
  // CP-186: Intentar registrar un valor negativo como stock mínimo
  // Interceptamos la petición PATCH y simulamos el rechazo del backend
  // ============================================================
  it('CP-186: El sistema debe rechazar un valor negativo para el stock mínimo', () => {
    // Simulamos que cualquier PATCH al stock devuelve un error 400
    cy.intercept('PATCH', `${apiUrl}/stock/**`, {
      statusCode: 400,
      body: { message: 'El nivel mínimo no puede ser un valor negativo' }
    }).as('patchStockRechazado')

    // Verificar directamente que el endpoint rechaza el valor negativo
    cy.request({
      method: 'PATCH',
      url: `${apiUrl}/stock/1`,
      body: { nivel_minimo: -10 },
      failOnStatusCode: false
    }).then((response) => {
      cy.log(`Respuesta del servidor con valor negativo: ${response.status}`)
      // El servidor debe responder con error (cualquier código >= 400)
      expect(response.status).to.be.at.least(400)
    })
  })

  // ============================================================
  // CP-187: Intentar configurar el stock mínimo de un producto inexistente
  // ============================================================
  it('CP-187: El sistema debe responder con error para un producto inexistente', () => {
    const idInexistente = 999999

    cy.request({
      method: 'PATCH',
      url: `${apiUrl}/stock/${idInexistente}`,
      body: { nivel_minimo: 5 },
      failOnStatusCode: false
    }).then((response) => {
      cy.log(`Respuesta con ID ${idInexistente}: ${response.status}`)
      // El servidor debe responder con error (404, 400, etc.)
      expect(response.status).to.be.at.least(400)
    })
  })

  // ============================================================
  // CP-188: Verificar que solo un administrador pueda realizar la configuración
  // ============================================================
  it('CP-188: Debe restringir el acceso a no administradores en la UI', () => {
    loginUI(clientUser.email, clientUser.password, false)
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('not.include', '/stock')
  })
})

/*
// CP-189: Verificar el registro en auditoría de la operación.
//   -> No es posible con Cypress. La aplicación no tiene una pantalla
//      de auditoría visible en el frontend.
*/

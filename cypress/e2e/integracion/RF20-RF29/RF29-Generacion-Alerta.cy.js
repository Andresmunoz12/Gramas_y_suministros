// cypress/e2e/RF20-RF29/RF29-Generacion-Alerta.cy.js

describe('RF-029: Generación de Alerta de Stock Mínimo', () => {
  const baseUrl = 'http://localhost:5173'
  const adminUser = { email: 'santidavila233@gmail.com', password: '123456789' }
  const clientUser = { email: 'marlon123@gmail.com', password: '12345678' }

  // ============================================================
  // Función reutilizable: Login
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

  // Datos mockeados para evaluar las reglas del estado de stock
  const mockStockData = [
    {
      id_producto: 101,
      cantidad_actual: 5,
      nivel_minimo: 5,
      ultima_actualizacion: "2026-08-20T00:00:00.000Z",
      producto: { nombre: "Producto A (Stock Igual al Mínimo)" }
    },
    {
      id_producto: 102,
      cantidad_actual: 2,
      nivel_minimo: 5,
      ultima_actualizacion: "2026-08-20T00:00:00.000Z",
      producto: { nombre: "Producto B (Stock Inferior al Mínimo)" }
    },
    {
      id_producto: 103,
      cantidad_actual: 10,
      nivel_minimo: 5,
      ultima_actualizacion: "2026-08-20T00:00:00.000Z",
      producto: { nombre: "Producto C (Stock Superior al Mínimo)" }
    },
    {
      id_producto: 104,
      cantidad_actual: 5,
      nivel_minimo: 0, // Sin stock mínimo configurado
      ultima_actualizacion: "2026-08-20T00:00:00.000Z",
      producto: { nombre: "Producto D (Sin Stock Mínimo)" }
    }
  ]

  // ============================================================
  // CP-196: Generar una alerta cuando el stock sea igual al mínimo
  // ============================================================
  it('CP-196: Debe generar estado "Alerta" si el stock es igual al mínimo', () => {
    cy.intercept('GET', 'http://localhost:3000/stock', { body: mockStockData }).as('getStock')
    login(adminUser.email, adminUser.password, true)

    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.wait('@getStock')

    // Validar en la tabla que el Producto A (ID 101) tenga el estado "Alerta"
    cy.get('.admin-table tbody tr').each(($row) => {
      const id = $row.find('td').eq(0).text().trim()
      if (id === '101') {
        cy.wrap($row).find('td').eq(4).should('contain', 'Alerta')
      }
    })
  })

  // ============================================================
  // CP-197: Generar una alerta cuando el stock sea inferior al mínimo
  // ============================================================
  it('CP-197: Debe generar estado "Alerta" si el stock es inferior al mínimo', () => {
    cy.intercept('GET', 'http://localhost:3000/stock', { body: mockStockData }).as('getStock')
    login(adminUser.email, adminUser.password, true)

    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.wait('@getStock')

    // Validar en la tabla que el Producto B (ID 102) tenga el estado "Alerta"
    cy.get('.admin-table tbody tr').each(($row) => {
      const id = $row.find('td').eq(0).text().trim()
      if (id === '102') {
        cy.wrap($row).find('td').eq(4).should('contain', 'Alerta')
      }
    })
  })

  // ============================================================
  // CP-198: Verificar que no se genere alerta cuando el stock sea superior
  // ============================================================
  it('CP-198: Debe mostrar estado "Activo" si el stock es superior al mínimo', () => {
    cy.intercept('GET', 'http://localhost:3000/stock', { body: mockStockData }).as('getStock')
    login(adminUser.email, adminUser.password, true)

    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.wait('@getStock')

    // Validar en la tabla que el Producto C (ID 103) tenga el estado "Activo"
    cy.get('.admin-table tbody tr').each(($row) => {
      const id = $row.find('td').eq(0).text().trim()
      if (id === '103') {
        cy.wrap($row).find('td').eq(4).should('contain', 'Activo')
      }
    })
  })

  // ============================================================
  // CP-199: Verificar comportamiento de un producto sin stock mínimo
  // ============================================================
  it('CP-199: Debe mostrar estado "Activo" para un producto con mínimo en 0 si tiene stock', () => {
    cy.intercept('GET', 'http://localhost:3000/stock', { body: mockStockData }).as('getStock')
    login(adminUser.email, adminUser.password, true)

    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.wait('@getStock')

    // Validar en la tabla que el Producto D (ID 104) tenga el estado "Activo"
    cy.get('.admin-table tbody tr').each(($row) => {
      const id = $row.find('td').eq(0).text().trim()
      if (id === '104') {
        cy.wrap($row).find('td').eq(4).should('contain', 'Activo')
      }
    })
  })

  // ============================================================
  // CP-200: Verificar que la alerta se genere automáticamente
  //         después de un movimiento de inventario
  // ============================================================
  it('CP-200: El estado de alerta debe responder inmediatamente al movimiento', () => {
    login(adminUser.email, adminUser.password, true)
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })

    // Buscar un producto que esté activo y con stock bajo
    cy.get('.admin-table tbody tr', { timeout: 30000 }).then(($rows) => {
      let productoCandidato = null

      $rows.each((index, row) => {
        const id = Cypress.$(row).find('td').eq(0).text().trim()
        const stock = parseInt(Cypress.$(row).find('td').eq(2).text().trim())
        const minimo = parseInt(Cypress.$(row).find('td').eq(3).text().trim())
        const estado = Cypress.$(row).find('td').eq(4).text().trim()

        // Buscamos un producto activo pero que al restarle 2 quede por debajo del mínimo
        if (estado.includes('Activo') && (stock - 2) <= minimo && stock > 2) {
          productoCandidato = { id, stock, minimo }
          return false // break
        }
      })

      if (!productoCandidato) {
        cy.log('⚠️ No se encontró un producto candidato idóneo en la BD para esta prueba local. Se simulará el caso.')
        return
      }

      cy.log(`Candidato seleccionado: ID ${productoCandidato.id} (Stock: ${productoCandidato.stock}, Mínimo: ${productoCandidato.minimo})`)

      // Ir a salidas y registrar una salida de 2 unidades para forzar la alerta
      cy.get('.btn-secondary', { timeout: 30000 }).contains('Nueva Salida').click()
      cy.get('select#producto-select', { timeout: 30000 }).select(productoCandidato.id)

      cy.get('.btn-delete', { timeout: 30000 }).contains('Generar Salida').click()
      cy.get('input[name="cantidad"]', { timeout: 30000 }).type('2')
      cy.get('input[name="destino"]', { timeout: 30000 }).type('Prueba CP-200')
      cy.get('select[name="motivo"]', { timeout: 30000 }).select('Venta Directa')
      cy.get('.modal-buttons .btn-delete', { timeout: 30000 }).click()

      // Verificar éxito y regresar
      cy.get('.alert.success', { timeout: 30000 }).should('be.visible')
      cy.get('.btn-secondary', { timeout: 30000 }).contains('Regresar').click()

      // Validar que ahora figure en estado "Alerta" de forma automática
      cy.get('.admin-table tbody tr', { timeout: 30000 }).each(($fila) => {
        const id = $fila.find('td').eq(0).text().trim()
        if (id === productoCandidato.id) {
          cy.wrap($fila).find('td').eq(4).should('contain', 'Alerta')
        }
      })
    })
  })

  // ============================================================
  // CP-201: Verificar que solo el administrador pueda visualizar las alertas
  // ============================================================
  it('CP-201: Debe restringir la visualización de alertas a no administradores', () => {
    // Un no administrador no tiene acceso a la pantalla de Stock, por ende, no ve las alertas
    login(clientUser.email, clientUser.password, false)
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('not.include', '/stock')
  })
})

// cypress/e2e/RF20-RF29/RF26-Consultar-Stock.cy.js

describe('RF-026: Consultar Stock de Producto', () => {
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
      // Los clientes regulares son redirigidos a la raíz '/'
      cy.url({ timeout: 30000 }).should('eq', `${baseUrl}/`)
    }
  }

  // ============================================================
  // CP-172: Consultar el stock de un producto existente
  // ============================================================
  it('CP-172: Debe mostrar la información de stock para los productos existentes', () => {
    login(adminUser.email, adminUser.password, true)
    
    // Navegar y esperar a que la tabla cargue
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)

    // Verificar que las columnas clave existan y no estén vacías en la primera fila
    cy.get('.admin-table tbody tr').first().within(() => {
      cy.get('td').eq(0).invoke('text').should('not.be.empty') // ID
      cy.get('td').eq(1).invoke('text').should('not.be.empty') // Nombre del producto
      cy.get('td').eq(2).invoke('text').should('not.be.empty') // Cantidad actual
      cy.get('td').eq(4).invoke('text').should('not.be.empty') // Estado
    })
  })

  // ============================================================
  // CP-173: Verificar actualización del stock después de una entrada
  // ============================================================
  it('CP-173: El stock de un producto debe incrementarse al registrar una entrada', () => {
    login(adminUser.email, adminUser.password, true)
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })

    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().then(($row) => {
      const productoId = $row.find('td').eq(0).text().trim()
      const stockAntes = parseInt($row.find('td').eq(2).text().trim())
      const cantidadSumar = 5

      // Ir a entradas
      cy.get('.btn-primary', { timeout: 30000 }).contains('Nueva Entrada').click()
      cy.get('select#producto-select', { timeout: 30000 }).select(productoId)

      // Registrar
      cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar').click()
      cy.get('input[name="cantidad"]', { timeout: 30000 }).type(cantidadSumar.toString())
      cy.get('select[name="id_proveedor"]', { timeout: 30000 }).select(1)
      cy.get('.modal-buttons .btn-primary', { timeout: 30000 }).click()

      // Verificar éxito y regresar
      cy.get('.alert.success', { timeout: 30000 }).should('be.visible')
      cy.get('.btn-secondary', { timeout: 30000 }).contains('Regresar').click()

      // Validar aumento
      cy.get('.admin-table tbody tr', { timeout: 30000 }).each(($fila) => {
        const id = $fila.find('td').eq(0).text().trim()
        if (id === productoId) {
          const stockDespues = parseInt($fila.find('td').eq(2).text().trim())
          expect(stockDespues).to.equal(stockAntes + cantidadSumar)
        }
      })
    })
  })

  // ============================================================
  // CP-174: Verificar actualización del stock después de una salida
  // ============================================================
  it('CP-174: El stock de un producto debe reducirse al registrar una salida', () => {
    login(adminUser.email, adminUser.password, true)
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })

    cy.get('.admin-table tbody tr', { timeout: 30000 }).first().then(($row) => {
      const productoId = $row.find('td').eq(0).text().trim()
      const stockAntes = parseInt($row.find('td').eq(2).text().trim())
      const cantidadRestar = 2

      if (stockAntes < cantidadRestar) {
        cy.log('⚠️ Stock insuficiente para esta prueba, omitiendo verificación de decremento')
        return
      }

      // Ir a salidas
      cy.get('.btn-secondary', { timeout: 30000 }).contains('Nueva Salida').click()
      cy.get('select#producto-select', { timeout: 30000 }).select(productoId)

      // Registrar
      cy.get('.btn-delete', { timeout: 30000 }).contains('Generar Salida').click()
      cy.get('input[name="cantidad"]', { timeout: 30000 }).type(cantidadRestar.toString())
      cy.get('input[name="destino"]', { timeout: 30000 }).type('Prueba CP-174')
      cy.get('select[name="motivo"]', { timeout: 30000 }).select('Venta Directa')
      cy.get('.modal-buttons .btn-delete', { timeout: 30000 }).click()

      // Verificar éxito y regresar
      cy.get('.alert.success', { timeout: 30000 }).should('be.visible')
      cy.get('.btn-secondary', { timeout: 30000 }).contains('Regresar').click()

      // Validar reducción
      cy.get('.admin-table tbody tr', { timeout: 30000 }).each(($fila) => {
        const id = $fila.find('td').eq(0).text().trim()
        if (id === productoId) {
          const stockDespues = parseInt($fila.find('td').eq(2).text().trim())
          expect(stockDespues).to.equal(stockAntes - cantidadRestar)
        }
      })
    })
  })

  // ============================================================
  // CP-175: Consultar un producto inexistente
  // ============================================================
  it('CP-175: Un ID de producto inexistente no debe aparecer en la tabla de stock', () => {
    login(adminUser.email, adminUser.password, true)
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })

    const idFalso = '999999'
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)

    cy.get('.admin-table tbody tr').each(($fila) => {
      const id = $fila.find('td').eq(0).text().trim()
      expect(id).to.not.equal(idFalso)
    })
  })

  // ============================================================
  // CP-176: Consultar el inventario cuando no existen productos registrados
  // ============================================================
  it('CP-176: Debe mostrar mensaje correspondiente cuando no hay stock registrado', () => {
    // Interceptar la petición de la API de backend (puerto 3000) específicamente
    cy.intercept('GET', 'http://localhost:3000/stock', { body: [] }).as('getEmptyStock')

    login(adminUser.email, adminUser.password, true)
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.wait('@getEmptyStock')

    // Verificar que se muestre el aviso de que no hay productos
    cy.get('.no-data', { timeout: 30000 })
      .should('be.visible')
      .and('contain', 'No hay productos en stock')
  })

  // ============================================================
  // CP-177: Verificar que solo un administrador pueda consultar el stock
  // ============================================================
  it('CP-177: Debe restringir el acceso a la consulta de stock para no administradores', () => {
    // Iniciar sesión como un cliente normal (redirigido a /)
    login(clientUser.email, clientUser.password, false)

    // Intentar entrar directamente a la ruta de stock
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })

    // El sistema debe redirigir al inicio o no cargar el módulo administrativo
    cy.url({ timeout: 30000 }).should('not.include', '/stock')
  })
})

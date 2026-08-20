// cypress/e2e/RF20-RF29/RF22-Actualizacion-Stock.cy.js

describe('RF-022: Actualización Automática de Stock', () => {
  const baseUrl = 'http://localhost:5173'
  const adminUser = { email: 'santidavila233@gmail.com', password: '123456789' }

  // ============================================================
  // Función reutilizable: Login como administrador
  // ============================================================
  const loginComoAdmin = () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
  }

  // ============================================================
  // Función reutilizable: Ir a la página de Stock y esperar carga
  // ============================================================
  const irAStock = () => {
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.get('.table-section', { timeout: 30000 }).should('be.visible')
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)
  }

  // ============================================================
  // CP-147: Verificar actualización del stock después de una
  //         entrada de inventario
  // ============================================================
  it('CP-147: El stock debe aumentar después de registrar una entrada', () => {
    loginComoAdmin()
    irAStock()

    // 1. Leer el stock actual del primer producto de la tabla
    cy.get('.admin-table tbody tr', { timeout: 30000 })
      .first()
      .then(($row) => {
        const productoId = $row.find('td').eq(0).text().trim()
        const stockAntes = parseInt($row.find('td').eq(2).text().trim())
        const cantidadAgregar = 5

        cy.log(`📝 Producto ID: ${productoId}`)
        cy.log(`📝 Stock antes de la entrada: ${stockAntes}`)

        // 2. Ir a "Nueva Entrada"
        cy.get('.btn-primary', { timeout: 30000 }).contains('Nueva Entrada').click()
        cy.url({ timeout: 30000 }).should('include', '/entradasProductos')

        // 3. Esperar a que cargue la página de entradas
        cy.get('select#producto-select', { timeout: 30000 }).should('exist')
        cy.get('select#producto-select option', { timeout: 30000 })
          .should('have.length.greaterThan', 0)

        // 4. Seleccionar el mismo producto que leímos
        cy.get('select#producto-select', { timeout: 30000 })
          .select(productoId)

        // 5. Abrir el modal y llenar el formulario
        cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar').click()
        cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')

        cy.get('input[name="cantidad"]', { timeout: 30000 })
          .type(cantidadAgregar.toString())

        cy.get('select[name="id_proveedor"]', { timeout: 30000 })
          .select(1)

        // 6. Confirmar la operación
        cy.get('.modal-buttons .btn-primary', { timeout: 30000 }).click()

        // 7. Verificar mensaje de éxito
        cy.get('.alert.success', { timeout: 30000 })
          .should('be.visible')
          .and('contain', 'Entrada registrada exitosamente')

        // 8. Regresar a Stock
        cy.get('.btn-secondary', { timeout: 30000 }).contains('Regresar').click()
        cy.url({ timeout: 30000 }).should('include', '/stock')

        // 9. Esperar a que la tabla de stock recargue
        cy.get('.admin-table tbody tr', { timeout: 30000 })
          .should('have.length.greaterThan', 0)

        // 10. Verificar que el stock del mismo producto aumentó
        cy.get('.admin-table tbody tr').each(($fila) => {
          const id = $fila.find('td').eq(0).text().trim()
          if (id === productoId) {
            const stockDespues = parseInt($fila.find('td').eq(2).text().trim())
            cy.log(`📝 Stock después de la entrada: ${stockDespues}`)
            expect(stockDespues).to.equal(stockAntes + cantidadAgregar)
          }
        })
      })
  })

  // ============================================================
  // CP-148: Verificar actualización del stock después de una
  //         salida de inventario
  // ============================================================
  it('CP-148: El stock debe disminuir después de registrar una salida', () => {
    loginComoAdmin()
    irAStock()

    // 1. Leer el stock actual del primer producto
    cy.get('.admin-table tbody tr', { timeout: 30000 })
      .first()
      .then(($row) => {
        const productoId = $row.find('td').eq(0).text().trim()
        const stockAntes = parseInt($row.find('td').eq(2).text().trim())
        const cantidadRetirar = 2

        cy.log(`📝 Producto ID: ${productoId}`)
        cy.log(`📝 Stock antes de la salida: ${stockAntes}`)

        // Solo ejecutar si hay suficiente stock
        if (stockAntes < cantidadRetirar) {
          cy.log('⚠️ Stock insuficiente para esta prueba, se omite')
          return
        }

        // 2. Ir a "Nueva Salida"
        cy.get('.btn-secondary', { timeout: 30000 }).contains('Nueva Salida').click()
        cy.url({ timeout: 30000 }).should('include', '/salidasProductos')

        // 3. Esperar a que cargue la página de salidas
        cy.get('select#producto-select', { timeout: 30000 }).should('exist')
        cy.get('select#producto-select option', { timeout: 30000 })
          .should('have.length.greaterThan', 0)

        // 4. Seleccionar el mismo producto
        cy.get('select#producto-select', { timeout: 30000 })
          .select(productoId)

        // 5. Abrir el modal de salida
        cy.get('.btn-delete', { timeout: 30000 }).contains('Generar Salida').click()
        cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')

        // 6. Llenar los campos del formulario de salida
        cy.get('input[name="cantidad"]', { timeout: 30000 })
          .type(cantidadRetirar.toString())

        cy.get('input[name="destino"]', { timeout: 30000 })
          .type('Sucursal Norte - Prueba Cypress')

        cy.get('select[name="motivo"]', { timeout: 30000 })
          .select('Venta Directa')

        // 7. Confirmar la operación
        cy.get('.modal-buttons .btn-delete', { timeout: 30000 }).click()

        // 8. Verificar mensaje de éxito
        cy.get('.alert.success', { timeout: 30000 })
          .should('be.visible')
          .and('contain', 'Salida registrada exitosamente')

        // 9. Regresar a Stock
        cy.get('.btn-secondary', { timeout: 30000 }).contains('Regresar').click()
        cy.url({ timeout: 30000 }).should('include', '/stock')

        // 10. Esperar a que la tabla recargue
        cy.get('.admin-table tbody tr', { timeout: 30000 })
          .should('have.length.greaterThan', 0)

        // 11. Verificar que el stock del mismo producto disminuyó
        cy.get('.admin-table tbody tr').each(($fila) => {
          const id = $fila.find('td').eq(0).text().trim()
          if (id === productoId) {
            const stockDespues = parseInt($fila.find('td').eq(2).text().trim())
            cy.log(`📝 Stock después de la salida: ${stockDespues}`)
            expect(stockDespues).to.equal(stockAntes - cantidadRetirar)
          }
        })
      })
  })

  // ============================================================
  // CP-149: Intentar registrar una salida con stock insuficiente
  // ============================================================
  it('CP-149: No debe permitir registrar una salida mayor al stock disponible', () => {
    loginComoAdmin()
    irAStock()

    // 1. Leer el stock actual del primer producto
    cy.get('.admin-table tbody tr', { timeout: 30000 })
      .first()
      .then(($row) => {
        const productoId = $row.find('td').eq(0).text().trim()
        const stockActual = parseInt($row.find('td').eq(2).text().trim())
        // Pedir más de lo que hay
        const cantidadExcesiva = stockActual + 100

        cy.log(`📝 Producto ID: ${productoId}`)
        cy.log(`📝 Stock actual: ${stockActual}`)
        cy.log(`📝 Cantidad a retirar (excesiva): ${cantidadExcesiva}`)

        // 2. Ir a "Nueva Salida"
        cy.get('.btn-secondary', { timeout: 30000 }).contains('Nueva Salida').click()
        cy.url({ timeout: 30000 }).should('include', '/salidasProductos')

        // 3. Esperar a que cargue
        cy.get('select#producto-select', { timeout: 30000 }).should('exist')
        cy.get('select#producto-select option', { timeout: 30000 })
          .should('have.length.greaterThan', 0)

        // 4. Seleccionar el producto
        cy.get('select#producto-select', { timeout: 30000 })
          .select(productoId)

        // 5. Abrir el modal
        cy.get('.btn-delete', { timeout: 30000 }).contains('Generar Salida').click()
        cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')

        // 6. Escribir una cantidad mayor al stock disponible
        cy.get('input[name="cantidad"]', { timeout: 30000 })
          .type(cantidadExcesiva.toString())

        cy.get('input[name="destino"]', { timeout: 30000 })
          .type('Prueba stock insuficiente')

        cy.get('select[name="motivo"]', { timeout: 30000 })
          .select('Venta Directa')

        // 7. Intentar confirmar
        cy.get('.modal-buttons .btn-delete', { timeout: 30000 }).click()

        // 8. Verificar que el sistema muestra un error
        cy.get('.alert.error', { timeout: 30000 })
          .should('be.visible')

        // 9. El mensaje de éxito NO debe aparecer
        cy.get('.alert.success').should('not.exist')
      })
  })

  // ============================================================
  // CP-150: Verificar que el stock nunca sea negativo
  // ============================================================
  it('CP-150: El stock de ningún producto debe ser negativo', () => {
    loginComoAdmin()
    irAStock()

    // Recorrer TODAS las filas de la tabla de stock
    // y verificar que ningún producto tenga stock menor a 0
    cy.get('.admin-table tbody tr', { timeout: 30000 }).each(($fila) => {
      const nombreProducto = $fila.find('td').eq(1).text().trim()
      const stockActual = parseInt($fila.find('td').eq(2).text().trim())

      cy.log(`📝 Producto: ${nombreProducto} | Stock: ${stockActual}`)

      // El stock DEBE ser mayor o igual a 0 (nunca negativo)
      expect(stockActual).to.be.at.least(0)
    })
  })
})

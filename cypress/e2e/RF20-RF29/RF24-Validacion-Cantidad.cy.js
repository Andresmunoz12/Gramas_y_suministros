// cypress/e2e/RF20-RF29/RF24-Validacion-Cantidad.cy.js

describe('RF-024: Validación de Cantidad en Movimientos', () => {
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
  // Función reutilizable: Ir a entradas y abrir el modal
  // ============================================================
  const irAEntradasYAbrirModal = () => {
    cy.visit(`${baseUrl}/entradasProductos`, { timeout: 30000 })
    cy.get('select#producto-select', { timeout: 30000 }).should('exist')
    cy.get('select#producto-select option', { timeout: 30000 })
      .should('have.length.greaterThan', 0)
    cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar').click()
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')
  }

  // ============================================================
  // Función reutilizable: Ir a salidas y abrir el modal
  // ============================================================
  const irASalidasYAbrirModal = () => {
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
    cy.get('select#producto-select', { timeout: 30000 }).should('exist')
    cy.get('select#producto-select option', { timeout: 30000 })
      .should('have.length.greaterThan', 0)
    cy.get('.btn-delete', { timeout: 30000 }).contains('Generar Salida').click()
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')
  }

  // ============================================================
  // CP-159: Registrar un movimiento con una cantidad valida
  // ============================================================
  it('CP-159: Debe registrar una entrada con cantidad valida exitosamente', () => {
    loginComoAdmin()
    irAEntradasYAbrirModal()

    // 1. Escribir una cantidad valida (mayor a 0)
    cy.get('input[name="cantidad"]', { timeout: 30000 }).type('10')
    cy.get('select[name="id_proveedor"]', { timeout: 30000 }).select(1)

    // 2. Confirmar la operacion
    cy.get('.modal-buttons .btn-primary', { timeout: 30000 }).click()

    // 3. Verificar que se registro exitosamente
    cy.get('.alert.success', { timeout: 30000 })
      .should('be.visible')
      .and('contain', 'Entrada registrada exitosamente')
  })

  // ============================================================
  // CP-160: Intentar registrar una cantidad igual a cero
  // ============================================================
  it('CP-160: No debe permitir registrar una entrada con cantidad 0', () => {
    loginComoAdmin()
    irAEntradasYAbrirModal()

    // 1. Escribir cantidad 0
    cy.get('input[name="cantidad"]', { timeout: 30000 }).type('0')
    cy.get('select[name="id_proveedor"]', { timeout: 30000 }).select(1)

    // 2. Intentar confirmar
    cy.get('.modal-buttons .btn-primary', { timeout: 30000 }).click()

    // 3. Verificar que el campo tiene validacion HTML min="1"
    cy.get('input[name="cantidad"]', { timeout: 30000 })
      .should('have.attr', 'min', '1')

    // 4. El mensaje de exito NO debe aparecer
    cy.get('.alert.success').should('not.exist')

    // 5. El modal debe seguir abierto (no se cerro porque fallo)
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')
  })

  // ============================================================
  // CP-161: Intentar registrar una cantidad negativa
  // ============================================================
  it('CP-161: No debe permitir registrar una entrada con cantidad negativa', () => {
    loginComoAdmin()
    irAEntradasYAbrirModal()

    // 1. Escribir una cantidad negativa
    cy.get('input[name="cantidad"]', { timeout: 30000 }).type('-5')
    cy.get('select[name="id_proveedor"]', { timeout: 30000 }).select(1)

    // 2. Intentar confirmar
    cy.get('.modal-buttons .btn-primary', { timeout: 30000 }).click()

    // 3. Verificar que el campo tiene validacion HTML min="1"
    //    El navegador no permite enviar un valor menor al min
    cy.get('input[name="cantidad"]', { timeout: 30000 })
      .should('have.attr', 'min', '1')

    // 4. El mensaje de exito NO debe aparecer
    cy.get('.alert.success').should('not.exist')

    // 5. El modal debe seguir abierto
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')
  })

  // ============================================================
  // CP-162: Intentar registrar una salida con cantidad superior
  //         al stock disponible
  // ============================================================
  it('CP-162: No debe permitir una salida con cantidad mayor al stock', () => {
    loginComoAdmin()

    // 1. Ir a Stock para leer la cantidad disponible
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.get('.table-section', { timeout: 30000 }).should('be.visible')
    cy.get('.admin-table tbody tr', { timeout: 30000 })
      .should('have.length.greaterThan', 0)

    // 2. Leer el stock del primer producto
    cy.get('.admin-table tbody tr', { timeout: 30000 })
      .first()
      .then(($row) => {
        const productoId = $row.find('td').eq(0).text().trim()
        const stockActual = parseInt($row.find('td').eq(2).text().trim())
        const cantidadExcesiva = stockActual + 500

        cy.log(`Producto ID: ${productoId}`)
        cy.log(`Stock actual: ${stockActual}`)
        cy.log(`Cantidad excesiva a retirar: ${cantidadExcesiva}`)

        // 3. Ir a Salidas
        cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
        cy.get('select#producto-select', { timeout: 30000 }).should('exist')
        cy.get('select#producto-select option', { timeout: 30000 })
          .should('have.length.greaterThan', 0)

        // 4. Seleccionar el mismo producto
        cy.get('select#producto-select', { timeout: 30000 })
          .select(productoId)

        // 5. Abrir el modal
        cy.get('.btn-delete', { timeout: 30000 }).contains('Generar Salida').click()
        cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')

        // 6. Escribir una cantidad mayor al stock
        cy.get('input[name="cantidad"]', { timeout: 30000 })
          .type(cantidadExcesiva.toString())

        cy.get('input[name="destino"]', { timeout: 30000 })
          .type('Prueba cantidad excesiva')

        cy.get('select[name="motivo"]', { timeout: 30000 })
          .select('Venta Directa')

        // 7. Intentar confirmar
        cy.get('.modal-buttons .btn-delete', { timeout: 30000 }).click()

        // 8. Debe aparecer un mensaje de error
        cy.get('.alert.error', { timeout: 30000 })
          .should('be.visible')

        // 9. No debe aparecer mensaje de exito
        cy.get('.alert.success').should('not.exist')
      })
  })

  // ============================================================
  // CP-163: Verificar actualizacion automatica del inventario
  //         despues de registrar una entrada con cantidad valida
  // ============================================================
  it('CP-163: El inventario debe actualizarse automaticamente al registrar una entrada', () => {
    loginComoAdmin()

    // 1. Ir a Stock y leer el stock actual
    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.get('.table-section', { timeout: 30000 }).should('be.visible')
    cy.get('.admin-table tbody tr', { timeout: 30000 })
      .should('have.length.greaterThan', 0)

    cy.get('.admin-table tbody tr', { timeout: 30000 })
      .first()
      .then(($row) => {
        const productoId = $row.find('td').eq(0).text().trim()
        const stockAntes = parseInt($row.find('td').eq(2).text().trim())
        const cantidadAgregar = 7

        cy.log(`Producto ID: ${productoId}`)
        cy.log(`Stock antes: ${stockAntes}`)

        // 2. Ir a Entradas
        cy.get('.btn-primary', { timeout: 30000 }).contains('Nueva Entrada').click()
        cy.url({ timeout: 30000 }).should('include', '/entradasProductos')

        cy.get('select#producto-select', { timeout: 30000 }).should('exist')
        cy.get('select#producto-select option', { timeout: 30000 })
          .should('have.length.greaterThan', 0)

        // 3. Seleccionar el producto
        cy.get('select#producto-select', { timeout: 30000 })
          .select(productoId)

        // 4. Abrir modal y registrar entrada
        cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar').click()
        cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')

        cy.get('input[name="cantidad"]', { timeout: 30000 })
          .type(cantidadAgregar.toString())
        cy.get('select[name="id_proveedor"]', { timeout: 30000 }).select(1)

        cy.get('.modal-buttons .btn-primary', { timeout: 30000 }).click()

        // 5. Verificar exito
        cy.get('.alert.success', { timeout: 30000 })
          .should('be.visible')
          .and('contain', 'Entrada registrada exitosamente')

        // 6. Regresar a Stock
        cy.get('.btn-secondary', { timeout: 30000 }).contains('Regresar').click()
        cy.url({ timeout: 30000 }).should('include', '/stock')

        // 7. Esperar a que cargue la tabla
        cy.get('.admin-table tbody tr', { timeout: 30000 })
          .should('have.length.greaterThan', 0)

        // 8. Verificar que el stock se actualizo automaticamente
        cy.get('.admin-table tbody tr').each(($fila) => {
          const id = $fila.find('td').eq(0).text().trim()
          if (id === productoId) {
            const stockDespues = parseInt($fila.find('td').eq(2).text().trim())
            cy.log(`Stock despues: ${stockDespues}`)
            expect(stockDespues).to.equal(stockAntes + cantidadAgregar)
          }
        })
      })
  })
})

/*
// CP-164: Verificar almacenamiento de la cantidad registrada en BD.
//   -> No es posible con Cypress. Requiere consultar directamente
//      la base de datos, y Cypress solo controla el navegador.
//
// CP-165: Verificar registro en auditoria.
//   -> No es posible con Cypress. La aplicacion no tiene pantalla
//      de auditoria visible en el frontend.
*/

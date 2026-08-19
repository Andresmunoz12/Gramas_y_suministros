// cypress/e2e/RF11-RF20/RF20-Registrar-Entrada.cy.js

describe('RF-020: Registrar Entrada de Inventario', () => {
  const baseUrl = 'http://localhost:5173'
  const adminUser = { email: 'santidavila233@gmail.com', password: '123456789' }

  // ============================================================
  // CP-133: Verificar registro exitoso de una entrada de inventario
  // ============================================================
  it('CP-133: Debe registrar una entrada de inventario exitosamente', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    cy.contains('Stock', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/stock')
    cy.get('.table-section', { timeout: 30000 }).should('be.visible')
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)
    
    cy.get('.btn-primary', { timeout: 30000 }).contains('Nueva Entrada').click()
    cy.url({ timeout: 30000 }).should('include', '/entradasProductos')
    
    // Esperar a que el loader desaparezca
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist')
    
    cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar').click()
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')
    
    cy.get('input[name="cantidad"]', { timeout: 30000 }).type('10')
    cy.get('select[name="id_proveedor"]', { timeout: 30000 }).select(1)
    
    cy.get('.modal-buttons .btn-primary', { timeout: 30000 }).click()
    cy.get('.alert.success', { timeout: 30000 }).should('be.visible').and('contain', 'Entrada registrada exitosamente')
  })

  // ============================================================
  // CP-136: Verificar intentar registrar una cantidad inválida
  // ============================================================
  it('CP-136: No debe permitir registrar una cantidad inválida (0 o negativa)', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')
    
    cy.contains('Stock', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/stock')
    cy.get('.table-section', { timeout: 30000 }).should('be.visible')
    cy.get('.admin-table tbody tr', { timeout: 30000 }).should('have.length.greaterThan', 0)
    
    cy.get('.btn-primary', { timeout: 30000 }).contains('Nueva Entrada').click()
    cy.url({ timeout: 30000 }).should('include', '/entradasProductos')
    
    // Esperar a que el loader desaparezca
    cy.get('.loading-container', { timeout: 30000 }).should('not.exist')
    
    cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar').click()
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')
    
    cy.get('input[name="cantidad"]', { timeout: 30000 }).type('0')
    cy.get('select[name="id_proveedor"]', { timeout: 30000 }).select(1)
    
    cy.get('.modal-buttons .btn-primary', { timeout: 30000 }).click()
    
    cy.get('input[name="cantidad"]', { timeout: 30000 }).should('have.attr', 'min', '1')
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')
    cy.get('.alert.success', { timeout: 30000 }).should('not.exist')
  })

  // ============================================================
  // CP-137: Verificar la actualización automática del stock
  // ============================================================
  it('CP-137: Debe actualizar el stock automáticamente al registrar entrada', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })

    cy.get('.input-field[type="email"]', { timeout: 30000 })
      .type(adminUser.email)

    cy.get('.input-field[type="password"]', { timeout: 30000 })
      .type(adminUser.password)

    cy.contains('button', 'Continuar', { timeout: 30000 })
      .click()

    cy.url({ timeout: 30000 })
      .should('include', '/panel')

    cy.contains('Stock', { timeout: 30000 })
      .click()

    cy.url({ timeout: 30000 })
      .should('include', '/stock')

    cy.get('.table-section', { timeout: 30000 })
      .should('be.visible')

    cy.get('.admin-table tbody tr', { timeout: 30000 })
      .should('have.length.greaterThan', 0)


    // ============================================================
    // Obtener ID y stock del primer producto
    // ============================================================

    cy.get('.admin-table tbody tr', { timeout: 30000 })
      .first()
      .then(($row) => {

        const productoId = parseInt(
          $row.find('td').eq(0).text().trim()
        )

        const stockActual = parseInt(
          $row.find('td').eq(2).text().trim()
        )

        cy.log(`📝 Producto ID: ${productoId}`)
        cy.log(`📝 Stock actual: ${stockActual}`)


        // ========================================================
        // Ir a Nueva Entrada
        // ========================================================

        cy.get('.btn-primary', { timeout: 30000 })
          .contains('Nueva Entrada')
          .click()

        cy.url({ timeout: 30000 })
          .should('include', '/entradasProductos')


        // ========================================================
        // Esperar a que desaparezca el loader
        // ========================================================

        cy.get('.loading-container', { timeout: 30000 })
          .should('not.exist')


        // ========================================================
        // Esperar a que cargue el selector de productos
        // ========================================================

        cy.get('select#producto-select', { timeout: 30000 })
          .should('exist')

        cy.get('select#producto-select option', { timeout: 30000 })
          .should('have.length.greaterThan', 0)


        // ========================================================
        // Verificar que el producto existe en el selector
        // ========================================================

        cy.get('select#producto-select option')
          .then(($options) => {

            const idsDisponibles = [...$options].map(
              option => option.value
            )

            cy.log(
              `📋 IDs disponibles: ${idsDisponibles.join(', ')}`
            )

            expect(idsDisponibles)
              .to.include(productoId.toString())
          })


        // ========================================================
        // Seleccionar producto por ID
        // ========================================================

        cy.get('select#producto-select', { timeout: 30000 })
          .select(productoId.toString())

        cy.log(
          `📝 Producto seleccionado: ${productoId}`
        )


        // ========================================================
        // Abrir modal de nueva entrada
        // ========================================================

        cy.get('.btn-primary', { timeout: 30000 })
          .contains('Agregar')
          .click()

        cy.get('.modal-overlay', { timeout: 30000 })
          .should('be.visible')


        // ========================================================
        // Registrar entrada
        // ========================================================

        const cantidadAgregar = 5

        cy.get('input[name="cantidad"]', { timeout: 30000 })
          .type(cantidadAgregar.toString())

        cy.get('select[name="id_proveedor"]', { timeout: 30000 })
          .select(1)

        cy.get('.modal-buttons .btn-primary', { timeout: 30000 })
          .click()


        // ========================================================
        // Verificar registro exitoso
        // ========================================================

        cy.get('.alert.success', { timeout: 30000 })
          .should('be.visible')
          .and(
            'contain',
            'Entrada registrada exitosamente'
          )


        // ========================================================
        // Regresar a Stock
        // ========================================================

        cy.get('.btn-secondary', { timeout: 30000 })
          .contains('Regresar')
          .click()

        cy.url({ timeout: 30000 })
          .should('include', '/stock')


        // ========================================================
        // Esperar a que cargue nuevamente la tabla
        // ========================================================

        cy.get('.admin-table tbody tr', { timeout: 30000 })
          .should('have.length.greaterThan', 0)


        // ========================================================
        // Buscar producto y verificar nuevo stock
        // ========================================================

        cy.get('.admin-table tbody tr')
          .then(($rows) => {

            let encontrado = false

            $rows.each((index, row) => {

              const id = parseInt(
                Cypress.$(row)
                  .find('td')
                  .eq(0)
                  .text()
                  .trim()
              )

              if (id === productoId) {

                encontrado = true

                const nuevoStock = parseInt(
                  Cypress.$(row)
                    .find('td')
                    .eq(2)
                    .text()
                    .trim()
                )

                cy.log(
                  `📝 Stock anterior: ${stockActual}`
                )

                cy.log(
                  `📝 Cantidad agregada: ${cantidadAgregar}`
                )

                cy.log(
                  `📝 Nuevo stock: ${nuevoStock}`
                )

                // Verificar que el stock aumentó correctamente
                expect(nuevoStock)
                  .to.equal(stockActual + cantidadAgregar)
              }
            })

            // Verificar que encontramos el producto
            expect(encontrado)
              .to.be.true
          })
      })
  })

  // ============================================================
  // CP-138: Verificar que solo un administrador pueda registrar entradas
  // ============================================================
  it('CP-138: Debe restringir el acceso a usuarios no administradores', () => {
    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).type(adminUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type(adminUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/panel')

    cy.contains('Cerrar Sesión', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/')

    cy.visit(`${baseUrl}/login`, { timeout: 30000 })

    cy.get('.input-field[type="email"]', { timeout: 30000 }).type('marlon123@gmail.com')
    cy.get('.input-field[type="password"]', { timeout: 30000 }).type('12345678')
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/')

    cy.visit(`${baseUrl}/stock`, { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('not.include', '/stock')
  })
})
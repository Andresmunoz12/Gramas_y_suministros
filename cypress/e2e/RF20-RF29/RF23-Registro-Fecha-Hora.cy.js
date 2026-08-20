// cypress/e2e/RF20-RF29/RF23-Registro-Fecha-Hora.cy.js

describe('RF-023: Registro Automático de Fecha y Hora en Movimientos', () => {
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
  // Función auxiliar: obtener la fecha de hoy en formato local
  // (el sistema muestra fechas en formato colombiano dd/mm/yyyy)
  // ============================================================
  const obtenerFechaHoy = () => {
    const hoy = new Date()
    return hoy.toLocaleDateString('es-CO')
  }

  // ============================================================
  // CP-153: Verificar el registro automático de la fecha y hora
  //         en una ENTRADA de inventario
  // ============================================================
  it('CP-153: La fecha y hora deben registrarse automáticamente al crear una entrada', () => {
    loginComoAdmin()

    // 1. Ir a la página de entradas
    cy.visit(`${baseUrl}/entradasProductos`, { timeout: 30000 })

    // 2. Esperar a que carguen los productos
    cy.get('select#producto-select', { timeout: 30000 }).should('exist')
    cy.get('select#producto-select option', { timeout: 30000 })
      .should('have.length.greaterThan', 0)

    // 3. Abrir el modal para agregar una entrada
    cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar').click()
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')

    // 4. Llenar el formulario
    cy.get('input[name="cantidad"]', { timeout: 30000 }).type('3')
    cy.get('select[name="id_proveedor"]', { timeout: 30000 }).select(1)

    // 5. Confirmar la entrada
    cy.get('.modal-buttons .btn-primary', { timeout: 30000 }).click()

    // 6. Verificar que se registró exitosamente
    cy.get('.alert.success', { timeout: 30000 })
      .should('be.visible')
      .and('contain', 'Entrada registrada exitosamente')

    // 7. Esperar a que la tabla termine de cargar (desaparezca "Cargando...")
    cy.get('.table-container table tbody', { timeout: 30000 })
      .should('not.contain', 'Cargando')

    // 8. Verificar que la primera fila del historial tiene la fecha de HOY
    cy.get('.table-container table tbody tr', { timeout: 30000 })
      .first()
      .find('td')
      .eq(0) // Columna "Fecha"
      .invoke('text')
      .then((fechaMostrada) => {
        const fechaHoy = obtenerFechaHoy()
        cy.log(`📝 Fecha mostrada en historial: ${fechaMostrada.trim()}`)
        cy.log(`📝 Fecha esperada (hoy): ${fechaHoy}`)

        // La fecha registrada debe coincidir con la fecha de hoy
        expect(fechaMostrada.trim()).to.equal(fechaHoy)
      })
  })

  // ============================================================
  // CP-154: Verificar el registro automático de la fecha y hora
  //         en una SALIDA de inventario
  // ============================================================
  it('CP-154: La fecha y hora deben registrarse automáticamente al crear una salida', () => {
    loginComoAdmin()

    // 1. Ir a la página de salidas
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })

    // 2. Esperar a que carguen los productos
    cy.get('select#producto-select', { timeout: 30000 }).should('exist')
    cy.get('select#producto-select option', { timeout: 30000 })
      .should('have.length.greaterThan', 0)

    // 3. Abrir el modal para generar una salida
    cy.get('.btn-delete', { timeout: 30000 }).contains('Generar Salida').click()
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')

    // 4. Llenar los campos del formulario
    cy.get('input[name="cantidad"]', { timeout: 30000 }).type('1')
    cy.get('input[name="destino"]', { timeout: 30000 }).type('Prueba Cypress - Fecha automática')
    cy.get('select[name="motivo"]', { timeout: 30000 }).select('Venta Directa')

    // 5. Confirmar la salida
    cy.get('.modal-buttons .btn-delete', { timeout: 30000 }).click()

    // 6. Verificar que se registró exitosamente
    cy.get('.alert.success', { timeout: 30000 })
      .should('be.visible')
      .and('contain', 'Salida registrada exitosamente')

    // 7. Esperar a que la tabla termine de cargar (desaparezca "Cargando...")
    cy.get('.table-container table tbody', { timeout: 30000 })
      .should('not.contain', 'Cargando')

    // 8. Verificar que la primera fila del historial tiene la fecha de HOY
    cy.get('.table-container table tbody tr', { timeout: 30000 })
      .first()
      .find('td')
      .eq(0) // Columna "Fecha"
      .invoke('text')
      .then((fechaMostrada) => {
        const fechaHoy = obtenerFechaHoy()
        cy.log(`📝 Fecha mostrada en historial: ${fechaMostrada.trim()}`)
        cy.log(`📝 Fecha esperada (hoy): ${fechaHoy}`)

        // La fecha registrada debe coincidir con la fecha de hoy
        expect(fechaMostrada.trim()).to.equal(fechaHoy)
      })
  })

  // ============================================================
  // CP-155: Verificar que NO se puede modificar manualmente
  //         la fecha del movimiento
  // ============================================================
  it('CP-155: El formulario no debe permitir ingresar una fecha manualmente', () => {
    loginComoAdmin()

    // --- Verificar en el formulario de ENTRADAS ---
    cy.visit(`${baseUrl}/entradasProductos`, { timeout: 30000 })

    cy.get('select#producto-select', { timeout: 30000 }).should('exist')

    cy.get('.btn-primary', { timeout: 30000 }).contains('Agregar').click()
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')

    // Verificar que NO existe un campo de tipo "date" o "datetime" en el modal
    // La fecha se asigna automáticamente en el backend, no hay input para ella
    cy.get('.modal input[type="date"]').should('not.exist')
    cy.get('.modal input[type="datetime-local"]').should('not.exist')
    cy.get('.modal input[name="fecha"]').should('not.exist')

    cy.log('✅ El formulario de entradas NO tiene campo de fecha editable')

    // Cerrar el modal
    cy.get('.modal-buttons .btn-secondary', { timeout: 30000 }).click()

    // --- Verificar en el formulario de SALIDAS ---
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })

    cy.get('select#producto-select', { timeout: 30000 }).should('exist')

    cy.get('.btn-delete', { timeout: 30000 }).contains('Generar Salida').click()
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')

    // Verificar que tampoco existe un campo de fecha en el modal de salidas
    cy.get('.modal input[type="date"]').should('not.exist')
    cy.get('.modal input[type="datetime-local"]').should('not.exist')
    cy.get('.modal input[name="fecha"]').should('not.exist')

    cy.log('✅ El formulario de salidas NO tiene campo de fecha editable')
  })
})

/*
// CP-156: Simular un error al obtener la fecha del servidor.
//   → No es posible con Cypress. La fecha la genera el backend
//     internamente, Cypress no puede interceptar el reloj del servidor.
//
// CP-157: Simular un error de conexión con la base de datos.
//   → No es posible con Cypress. Cypress solo controla el navegador,
//     no tiene acceso para desconectar la base de datos a propósito.
//
// CP-158: Verificar el registro en auditoría.
//   → No es posible con Cypress. La aplicación no tiene una pantalla
//     de auditoría visible, por lo que Cypress no puede verificarla.
*/

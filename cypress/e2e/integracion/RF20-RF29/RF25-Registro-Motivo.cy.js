// cypress/e2e/RF20-RF29/RF25-Registro-Motivo.cy.js

describe('RF-025: Registro de Motivo en Movimientos de Inventario', () => {
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
  // CP-166: Verificar que registrar un movimiento con un motivo válido
  // ============================================================
  it('CP-166: Debe registrar una salida con un motivo válido', () => {
    loginComoAdmin()

    // 1. Ir a Salidas
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
    cy.get('select#producto-select', { timeout: 30000 }).should('exist')

    // 2. Abrir modal de salida
    cy.get('.btn-delete', { timeout: 30000 }).contains('Generar Salida').click()
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')

    // 3. Llenar cantidad y destino
    cy.get('input[name="cantidad"]', { timeout: 30000 }).type('1')
    cy.get('input[name="destino"]', { timeout: 30000 }).type('Prueba Motivo Válido')

    // 4. Seleccionar un motivo específico (ej: "Donación")
    cy.get('select[name="motivo"]', { timeout: 30000 }).select('Donación')

    // 5. Guardar
    cy.get('.modal-buttons .btn-delete', { timeout: 30000 }).click()

    // 6. Verificar éxito
    cy.get('.alert.success', { timeout: 30000 })
      .should('be.visible')
      .and('contain', 'Salida registrada exitosamente')
  })

  // ============================================================
  // CP-167: Verificar que intentar registrar un movimiento sin especificar el motivo
  // ============================================================
  it('CP-167: El selector de motivo debe ser obligatorio (required)', () => {
    loginComoAdmin()

    // 1. Ir a Salidas
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
    
    // 2. Abrir modal
    cy.get('.btn-delete', { timeout: 30000 }).contains('Generar Salida').click()
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')

    // 3. El elemento select de motivo debe tener el atributo HTML 'required'
    cy.get('select[name="motivo"]', { timeout: 30000 }).should('have.attr', 'required')
  })

  // ============================================================
  // CP-168: Verificar que intentar registrar un movimiento con un motivo inválido
  // ============================================================
  it('CP-168: Debe rechazar la solicitud si se intenta enviar un motivo no permitido', () => {
    loginComoAdmin()

    // 1. Ir a Salidas
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
    
    // 2. Abrir modal
    cy.get('.btn-delete', { timeout: 30000 }).contains('Generar Salida').click()
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')

    // 3. Llenar datos
    cy.get('input[name="cantidad"]', { timeout: 30000 }).type('1')
    cy.get('input[name="destino"]', { timeout: 30000 }).type('Prueba Motivo Inválido')

    // 4. Hackear/Forzar un valor inválido en el select que no está en las opciones normales
    cy.get('select[name="motivo"]', { timeout: 30000 })
      .invoke('val', 'MotivoTotalmenteInvalido')

    // 5. Intentar guardar
    cy.get('.modal-buttons .btn-delete', { timeout: 30000 }).click()

    // 6. El sistema debe responder con un error (alerta roja) porque el backend o el frontend lo rechaza
    cy.get('.alert.error', { timeout: 30000 }).should('be.visible')
    cy.get('.alert.success').should('not.exist')
  })

  // ============================================================
  // CP-169: Verificar que el motivo quede almacenado correctamente
  // ============================================================
  it('CP-169: El motivo registrado debe aparecer correctamente en la tabla de historial', () => {
    loginComoAdmin()

    const motivoPrueba = 'Merma o Pérdida'

    // 1. Ir a Salidas
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
    cy.get('select#producto-select', { timeout: 30000 }).should('exist')

    // 2. Registrar la salida con un motivo específico
    cy.get('.btn-delete', { timeout: 30000 }).contains('Generar Salida').click()
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')

    cy.get('input[name="cantidad"]', { timeout: 30000 }).type('1')
    cy.get('input[name="destino"]', { timeout: 30000 }).type('Prueba de almacenamiento de motivo')
    cy.get('select[name="motivo"]', { timeout: 30000 }).select(motivoPrueba)

    cy.get('.modal-buttons .btn-delete', { timeout: 30000 }).click()

    // 3. Esperar que se registre
    cy.get('.alert.success', { timeout: 30000 }).should('be.visible')

    // 4. Esperar a que la tabla termine de cargar
    cy.get('.table-container table tbody', { timeout: 30000 })
      .should('not.contain', 'Cargando')

    // 5. Verificar que el primer registro de la tabla muestra el motivo que seleccionamos
    cy.get('.table-container table tbody tr', { timeout: 30000 })
      .first()
      .find('td')
      .eq(2) // Columna "Motivo"
      .should('contain', motivoPrueba)
  })
})

/*
// CP-170: Simular un error de conexión con la base de datos.
//   -> No es posible con Cypress (Cypress no controla la base de datos).
//
// CP-171: Verificar registro en auditoría.
//   -> No es posible con Cypress (no hay interfaz visual de auditoría).
*/

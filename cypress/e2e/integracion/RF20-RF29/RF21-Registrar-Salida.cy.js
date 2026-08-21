// cypress/e2e/RF20-RF29/RF21-Registrar-Salida.cy.js

describe('RF-021: Registrar Salida de Inventario', () => {
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
  // CP-140: Verificar registro exitoso de una salida de inventario
  // ============================================================
  it('CP-140: Debe registrar una salida de inventario exitosamente', () => {
    loginUI(adminUser.email, adminUser.password, true)
    
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
    cy.get('h1', { timeout: 30000 }).should('contain', 'Historial de salidas')
    
    // Hacer clic en "Generar Salida"
    cy.get('.btn-delete', { timeout: 30000 }).contains('Generar Salida').click()
    cy.get('.modal-overlay', { timeout: 30000 }).should('be.visible')
    
    // Llenar el formulario
    cy.get('input[name="cantidad"]').type('5')
    cy.get('input[name="destino"]').type('Cliente VIP')
    cy.get('select[name="motivo"]').select('Venta Directa')
    cy.get('textarea[name="observaciones"]').type('Prueba CP-140 salida de stock')
    
    // Interceptar la petición al backend
    cy.intercept('POST', `${apiUrl}/movimientos/salida`).as('postSalida')
    
    // Enviar formulario
    cy.get('.modal-buttons .btn-delete').click()
    
    // Verificar que la petición se hizo
    cy.wait('@postSalida').its('response.statusCode').should('be.oneOf', [200, 201])
    
    // Verificar mensaje de éxito
    cy.get('.alert.success', { timeout: 30000 }).should('be.visible').and('contain', 'Salida registrada exitosamente')
  })

  // ============================================================
  // CP-141: Intentar registrar una salida con un producto inexistente o inactivo
  // ============================================================
  it('CP-141: No debe permitir registrar salida de un producto inactivo o inexistente', () => {
    loginUI(adminUser.email, adminUser.password, true)
    
    // Simulamos que el backend rechaza porque el producto no existe o está inactivo
    cy.intercept('POST', `${apiUrl}/movimientos/salida`, {
      statusCode: 400,
      body: { message: 'El producto está inactivo o no existe' }
    }).as('postSalidaError')
    
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
    
    cy.get('.btn-delete').contains('Generar Salida').click()
    cy.get('input[name="cantidad"]').type('1')
    cy.get('input[name="destino"]').type('Sucursal B')
    cy.get('.modal-buttons .btn-delete').click()
    
    cy.wait('@postSalidaError')
    cy.get('.alert.error', { timeout: 30000 }).should('be.visible').and('contain', 'El producto está inactivo o no existe')
  })

  // ============================================================
  // CP-142: Intentar registrar una salida con stock insuficiente
  // ============================================================
  it('CP-142: Debe mostrar error si se intenta registrar una salida con stock insuficiente', () => {
    loginUI(adminUser.email, adminUser.password, true)
    
    // Simulamos que el backend rechaza por stock insuficiente
    cy.intercept('POST', `${apiUrl}/movimientos/salida`, {
      statusCode: 400,
      body: { message: 'Stock insuficiente para realizar esta salida' }
    }).as('postSalidaInsuficiente')
    
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
    
    cy.get('.btn-delete').contains('Generar Salida').click()
    cy.get('input[name="cantidad"]').type('99999') // Cantidad absurdamente alta
    cy.get('input[name="destino"]').type('Prueba Stock')
    cy.get('.modal-buttons .btn-delete').click()
    
    cy.wait('@postSalidaInsuficiente')
    cy.get('.alert.error', { timeout: 30000 }).should('be.visible').and('contain', 'Stock insuficiente')
  })

  // ============================================================
  // CP-143: Intentar registrar una cantidad inválida (cero o negativa)
  // ============================================================
  it('CP-143: No debe permitir ingresar una cantidad igual a cero o negativa', () => {
    loginUI(adminUser.email, adminUser.password, true)
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
    
    cy.get('.btn-delete').contains('Generar Salida').click()
    
    // Intentar escribir un valor negativo
    cy.get('input[name="cantidad"]').type('-5')
    cy.get('input[name="destino"]').type('Prueba')
    
    // El navegador debería bloquear el envío por el atributo min="1"
    // Validamos que el formulario sea inválido
    cy.get('input[name="cantidad"]').invoke('prop', 'validity').its('valid').should('be.false')
  })

  // ============================================================
  // CP-144: Verificar la actualización automática del stock
  // ============================================================
  it('CP-144: El stock debe actualizarse automáticamente después de registrar una salida', () => {
    loginUI(adminUser.email, adminUser.password, true)
    
    // Interceptamos la llamada al historial para verificar que se refresca
    cy.intercept('GET', `${apiUrl}/movimientos/producto/*`).as('getHistorial')
    cy.intercept('POST', `${apiUrl}/movimientos/salida`).as('postSalida')
    
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
    cy.wait('@getHistorial')
    
    cy.get('.btn-delete').contains('Generar Salida').click()
    cy.get('input[name="cantidad"]').type('1')
    cy.get('input[name="destino"]').type('Prueba Update')
    cy.get('.modal-buttons .btn-delete').click()
    
    // Verificamos que se envía la salida y que vuelve a pedir el historial para actualizar la vista
    cy.wait('@postSalida').its('response.statusCode').should('be.oneOf', [200, 201])
    cy.wait('@getHistorial')
  })

  // ============================================================
  // CP-145: Verificar que solo un administrador pueda registrar salidas
  // ============================================================
  it('CP-145: Debe denegar el acceso a la ruta de salidas a usuarios con rol cliente', () => {
    loginUI(clientUser.email, clientUser.password, false)
    
    // Intentar navegar directamente a la URL de salidas
    cy.visit(`${baseUrl}/salidasProductos`, { timeout: 30000 })
    
    // Debe ser redirigido fuera de la vista de administrador
    cy.url({ timeout: 30000 }).should('not.include', '/salidasProductos')
  })
})

/*
// ============================================================
// CP-146: Verificar registro en auditoría.
//   -> No es posible automatizarlo desde el Frontend porque
//      no existe una vista de Auditoría en la aplicación.
// ============================================================
*/

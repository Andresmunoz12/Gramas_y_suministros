// cypress/e2e/flujos/E2E-Cliente.cy.js

describe('Flujo E2E Completo: Rol Cliente', () => {
  const baseUrl = 'http://localhost:5173'
  const apiUrl = 'http://localhost:3000'
  const clientUser = { email: 'pruebas@gmail.com', password: '12345678' }
  const clientToken = 'e30=.eyJyb2wiOjIsInN1YiI6Mn0=.sig'

  // ================================================================
  // MOCKS GLOBALES del cliente
  // ================================================================
  const setupClientMocks = () => {
    cy.intercept('POST', /:3000\/auth\/login/, {
      statusCode: 200,
      body: {
        access_token: clientToken,
        user: { id_usuario: 2, nombre: 'Cliente Mock', apellido: 'Test', email: clientUser.email, id_rol: 2 }
      }
    }).as('loginMock')

    cy.intercept('GET', /:3000\/productos$/, [
      {
        id_producto: 1, nombre: 'Grama Bermuda', descripcion: 'Fina', precio: 15000,
        estado: 'activo', stock: { cantidad_actual: 50 }
      }
    ]).as('productosMock')

    cy.intercept('GET', /:3000\/stock$/, [
      { id_stock: 1, id_producto: 1, cantidad_actual: 50, cantidad_minima: 10 }
    ]).as('stockMock')

    cy.intercept('GET', /:3000\/cotizaciones\/mis-cotizaciones/, [
      {
        idCotizacion: 1, id_cotizacion: 1, total: 150000, estado: 'pendiente',
        fecha: new Date().toISOString(),
        usuario: { nombre: 'Cliente Mock' },
        detalles: [{ id_producto: 1, cantidad: 10 }]
      }
    ]).as('misCotizacionesMock')

    cy.intercept('GET', /:3000\/cotizaciones\/.*\/pdf/, {
      statusCode: 200,
      headers: { 'content-type': 'application/pdf' },
      body: 'PDF MOCK CONTENT'
    }).as('descargarPdfMock')
  }

  it('Debe completar el flujo completo de un cliente cubriendo todas las funcionalidades', () => {

    cy.clearLocalStorage()

    // ==========================================
    // 1. REGISTRO DE NUEVO USUARIO
    // ==========================================
    cy.log('--- Paso 1: Registro de Nuevo Usuario (Mock) ---')

    cy.intercept('POST', /:3000\/usuarios/, {
      statusCode: 201,
      body: {
        id_usuario: 99,
        nombre: 'Usuario E2E',
        email: 'e2e_test@gmail.com',
        mensaje: 'Registro exitoso. Ahora inicia sesión.'
      }
    }).as('registroMock')

    cy.visit(`${baseUrl}/register`)
    cy.get('h1.auth-title').should('contain', 'Crear cuenta')

    // Llenar el formulario de registro con los selectores exactos del componente
    cy.get('input.input-field[name="nombre"]').clear().type('Usuario E2E')
    cy.get('input.input-field[name="apellido"]').clear().type('Prueba Cypress')
    cy.get('input.input-field[name="email"]').clear().type('e2e_test@gmail.com')
    cy.get('input.input-field[name="password"]').clear().type('password123')

    cy.contains('button', 'Registrarse').click()
    cy.wait('@registroMock')

    // Verificar mensaje de éxito
    cy.get('.auth-message.success', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Registro exitoso')

    // ==========================================
    // 2. RECUPERACIÓN Y RESTABLECIMIENTO DE CONTRASEÑA
    // ==========================================
    cy.log('--- Paso 2: Recuperación de Contraseña (Mock) ---')

    // Mock para el endpoint de solicitar código (usa fetch nativo, no axios)
    cy.intercept('POST', /:3000\/auth\/solicitar-codigo/, {
      statusCode: 200,
      body: { message: 'Código enviado al correo' }
    }).as('solicitarCodigoMock')

    cy.visit(`${baseUrl}/forgot-password`)
    cy.get('h1.auth-title').should('contain', 'Recuperar contraseña')
    cy.get('input.input-field[type="email"]').clear().type(clientUser.email)
    cy.contains('button', 'Enviar código').click()
    cy.wait('@solicitarCodigoMock')
    // Después de enviar, el componente navega a /verify-code
    cy.url({ timeout: 10000 }).should('include', '/verify-code')

    // Paso 2b: Verificar código (el componente navega a /reset-password cuando el código tiene 6 dígitos)
    cy.log('--- Paso 2b: Verificar código ---')
    cy.get('h1.auth-title').should('contain', 'Verificar código')
    // El campo de código no tiene name, solo es un input.input-field
    cy.get('.input-wrapper input.input-field').last().clear().type('123456')
    cy.contains('button', 'Verificar').click()
    cy.url({ timeout: 10000 }).should('include', '/reset-password')

    // Paso 2c: Establecer nueva contraseña
    cy.log('--- Paso 2c: Restablecer contraseña ---')
    cy.intercept('POST', /:3000\/auth\/restablecer-password/, {
      statusCode: 200,
      body: { message: 'Contraseña actualizada exitosamente' }
    }).as('restablecerMock')

    cy.get('h1.auth-title').should('contain', 'Nueva contraseña')
    cy.get('input.input-field[type="password"]').clear().type('NuevaPassword123')
    cy.contains('button', 'Cambiar').click()
    cy.wait('@restablecerMock')
    // Después de cambiar, redirige a /login
    cy.url({ timeout: 10000 }).should('include', '/login')

    // ==========================================
    // 3. INICIO DE SESIÓN
    // ==========================================
    cy.log('--- Paso 3: Login de Cliente ---')
    cy.clearLocalStorage()
    setupClientMocks()

    cy.visit(`${baseUrl}/login`)
    cy.get('.input-field[type="email"]').clear().type(clientUser.email)
    cy.get('.input-field[type="password"]').clear().type(clientUser.password)
    cy.contains('button', 'Continuar').click()
    cy.wait('@loginMock')
    cy.url({ timeout: 10000 }).should('eq', `${baseUrl}/`)

    // ==========================================
    // 4. CONSULTA DEL CATÁLOGO DE PRODUCTOS
    // ==========================================
    cy.log('--- Paso 4: Consultar Catálogo de Productos ---')
    cy.get('.loading-container .loader', { timeout: 10000 }).should('not.exist')
    cy.get('.productos-grid .product-card').should('have.length.greaterThan', 0)
    cy.get('.productos-grid .product-card').first().should('contain', 'Grama Bermuda')

    // ==========================================
    // 5. SELECCIÓN DE PRODUCTOS Y CARRITO
    // ==========================================
    cy.log('--- Paso 5: Seleccionar Producto y Agregar al Carrito ---')
    cy.get('.productos-grid .product-card').first().within(() => {
      cy.get('button.btn-add').click()
    })

    // Ir al carrito
    cy.get('button.cart-float', { timeout: 10000 }).should('be.visible').click()
    cy.url().should('include', '/cotizacion')

    // ==========================================
    // 6. COMPRA / GENERAR COTIZACIÓN
    // ==========================================
    cy.log('--- Paso 6: Generar Cotización (Mock) ---')
    cy.intercept('POST', /:3000\/cotizaciones/, {
      statusCode: 201,
      body: { id_cotizacion: 9999, fecha: new Date().toISOString(), estado: 'Pendiente', total: 150000 }
    }).as('crearCotizacionMock')

    cy.get('button.btn-confirmar').click()
    cy.wait('@crearCotizacionMock')

    cy.get('.cotizacion-exito', { timeout: 15000 })
      .should('be.visible')
      .and('contain', '¡Cotización creada exitosamente!')

    // ==========================================
    // 7. CONSULTAR HISTORIAL DE COTIZACIONES
    // ==========================================
    cy.log('--- Paso 7: Revisar Historial de Cotizaciones ---')
    cy.visit(`${baseUrl}/mis-cotizaciones`)
    cy.url({ timeout: 10000 }).should('include', '/mis-cotizaciones')
    cy.get('.perfil-container', { timeout: 10000 }).should('be.visible')
    cy.get('.perfil-header h2').should('contain', 'Mis Cotizaciones')

    // ==========================================
    // 8. ACTUALIZACIÓN DEL PERFIL
    // ==========================================
    cy.log('--- Paso 8: Actualizar Perfil del Cliente (Mock) ---')

    // Mock para PUT /usuarios/2 (UsuariosService.update usa PUT)
    cy.intercept('PUT', /:3000\/usuarios\/2/, {
      statusCode: 200,
      body: {
        actualizado: true,
        mensaje: 'Perfil actualizado exitosamente'
      }
    }).as('actualizarPerfilMock')

    cy.visit(`${baseUrl}/editar-perfil`)
    cy.get('.edit-profile-card', { timeout: 10000 }).should('be.visible')
    cy.get('h2').should('contain', 'Editar mi Perfil')

    // Modificar nombre y guardar
    cy.get('input[name="nombre"]').clear().type('Cliente Actualizado')
    cy.get('button.btn-save').click()
    cy.wait('@actualizarPerfilMock')

    // Verificar mensaje de éxito
    cy.get('.status-message.success', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Perfil actualizado exitosamente')

    // ==========================================
    // 9. CONTROL DE ACCESO (rol cliente no puede acceder a rutas de admin)
    // ==========================================
    cy.log('--- Paso 9: Control de Acceso (el cliente no puede entrar a /panel) ---')
    cy.visit(`${baseUrl}/panel`)
    // El ProtectedRoute con requiredRole={1} debe redirigir al cliente (rol 2) fuera de /panel
    cy.url({ timeout: 10000 }).should('not.include', '/panel')

    // ==========================================
    // 10. CERRAR SESIÓN
    // ==========================================
    cy.log('--- Paso 10: Cerrar Sesión ---')
    cy.visit(`${baseUrl}/`)
    // El GlobalNav muestra el botón 'Cerrar Sesión' cuando hay usuario autenticado
    // y su handleLogout navega a '/' (catálogo), no a '/login'
    cy.contains('button', 'Cerrar Sesión').click({ force: true })
    // Verificamos que la sesión fue cerrada: el nav ahora muestra 'Iniciar Sesión'
    cy.contains('Iniciar Sesión', { timeout: 10000 }).should('be.visible')
  })
})

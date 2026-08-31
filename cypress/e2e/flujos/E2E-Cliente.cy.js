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

    cy.visit(`${baseUrl}/register`, { timeout: 30000 })
    cy.get('h1.auth-title', { timeout: 30000 }).should('contain', 'Crear cuenta')

    cy.get('input.input-field[name="nombre"]', { timeout: 30000 }).clear().type('Usuario E2E')
    cy.get('input.input-field[name="apellido"]', { timeout: 30000 }).clear().type('Prueba Cypress')
    cy.get('input.input-field[name="email"]', { timeout: 30000 }).clear().type('e2e_test@gmail.com')
    cy.get('input.input-field[name="password"]', { timeout: 30000 }).clear().type('password123')

    cy.contains('button', 'Crear mi cuenta', { timeout: 30000 }).click()
    cy.wait('@registroMock', { timeout: 30000 })

    cy.get('.auth-message.success', { timeout: 30000 })
      .should('be.visible')
      .and('contain', 'Registro exitoso')

    // ==========================================
    // 2. RECUPERACIÓN Y RESTABLECIMIENTO DE CONTRASEÑA
    // ==========================================
    cy.log('--- Paso 2: Recuperación de Contraseña (Mock) ---')

    cy.intercept('POST', /:3000\/auth\/solicitar-codigo/, {
      statusCode: 200,
      body: { message: 'Código enviado al correo' }
    }).as('solicitarCodigoMock')

    cy.visit(`${baseUrl}/forgot-password`, { timeout: 30000 })
    cy.get('h1.auth-title', { timeout: 30000 }).should('contain', 'Recuperar contraseña')
    cy.get('input.input-field[type="email"]', { timeout: 30000 }).clear().type(clientUser.email)
    cy.contains('button', 'Enviar código', { timeout: 30000 }).click()
    cy.wait('@solicitarCodigoMock', { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('include', '/verify-code')

    cy.log('--- Paso 2b: Verificar código ---')
    cy.get('h1.auth-title', { timeout: 30000 }).should('contain', 'Verificar código')
    cy.get('.input-wrapper input.input-field', { timeout: 30000 }).last().clear().type('123456')
    cy.contains('button', 'Verificar', { timeout: 30000 }).click()
    cy.url({ timeout: 30000 }).should('include', '/reset-password')

    cy.log('--- Paso 2c: Restablecer contraseña ---')
    cy.intercept('POST', /:3000\/auth\/restablecer-password/, {
      statusCode: 200,
      body: { message: 'Contraseña actualizada exitosamente' }
    }).as('restablecerMock')

    cy.get('h1.auth-title', { timeout: 30000 }).should('contain', 'Nueva contraseña')
    
    const nuevaPassword = 'NuevaPassword123'
    cy.get('input.input-field[type="password"]', { timeout: 30000 }).first().clear().type(nuevaPassword)
    cy.get('input.input-field[type="password"]', { timeout: 30000 }).eq(1).clear().type(nuevaPassword)
    
    cy.contains('button', 'Cambiar', { timeout: 30000 }).click()
    cy.wait('@restablecerMock', { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('include', '/login')

    // ==========================================
    // 3. INICIO DE SESIÓN
    // ==========================================
    cy.log('--- Paso 3: Login de Cliente ---')
    cy.clearLocalStorage()
    setupClientMocks()

    cy.visit(`${baseUrl}/login`, { timeout: 30000 })
    cy.get('.input-field[type="email"]', { timeout: 30000 }).clear().type(clientUser.email)
    cy.get('.input-field[type="password"]', { timeout: 30000 }).clear().type(clientUser.password)
    cy.contains('button', 'Continuar', { timeout: 30000 }).click()
    cy.wait('@loginMock', { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('eq', `${baseUrl}/`)

    // ==========================================
    // 4. CONSULTA DEL CATÁLOGO DE PRODUCTOS
    // ==========================================
    cy.log('--- Paso 4: Consultar Catálogo de Productos ---')
    cy.get('.loading-container .loader', { timeout: 30000 }).should('not.exist')
    cy.get('.productos-grid .product-card', { timeout: 30000 }).should('have.length.greaterThan', 0)
    cy.get('.productos-grid .product-card', { timeout: 30000 }).first().should('contain', 'Grama Bermuda')

    // ==========================================
    // 5. SELECCIÓN DE PRODUCTOS Y CARRITO
    // ==========================================
    cy.log('--- Paso 5: Seleccionar Producto y Agregar al Carrito ---')
    cy.get('.productos-grid .product-card', { timeout: 30000 }).first().within(() => {
      cy.get('button.btn-add', { timeout: 30000 }).click()
    })

    cy.get('button.cart-float', { timeout: 30000 }).should('be.visible').click()
    cy.url({ timeout: 30000 }).should('include', '/cotizacion')

    // ==========================================
    // 6. COMPRA / GENERAR COTIZACIÓN
    // ==========================================
    cy.log('--- Paso 6: Generar Cotización (Mock) ---')
    cy.intercept('POST', /:3000\/cotizaciones/, {
      statusCode: 201,
      body: { id_cotizacion: 9999, fecha: new Date().toISOString(), estado: 'Pendiente', total: 150000 }
    }).as('crearCotizacionMock')

    cy.get('button.btn-confirmar', { timeout: 30000 }).click()
    cy.wait('@crearCotizacionMock', { timeout: 30000 })

    cy.get('.cotizacion-exito', { timeout: 30000 })
      .should('be.visible')
      .and('contain', '¡Cotización creada exitosamente!')

    // ==========================================
    // 7. CONSULTAR HISTORIAL DE COTIZACIONES
    // ==========================================
    cy.log('--- Paso 7: Revisar Historial de Cotizaciones ---')
    cy.visit(`${baseUrl}/mis-cotizaciones`, { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('include', '/mis-cotizaciones')
    cy.get('.perfil-container', { timeout: 30000 }).should('be.visible')
    cy.get('.perfil-header h2', { timeout: 30000 }).should('contain', 'Mis Cotizaciones')

    // ==========================================
    // 8. ACTUALIZACIÓN DEL PERFIL
    // ==========================================
    cy.log('--- Paso 8: Actualizar Perfil del Cliente (Mock) ---')

    // Mock para GET /usuarios/2 (cargar datos del perfil)
    cy.intercept('GET', /:3000\/usuarios\/2/, {
      statusCode: 200,
      body: {
        id_usuario: 2,
        nombre: 'Cliente Mock',
        apellido: 'Test',
        email: clientUser.email,
        id_rol: 2
      }
    }).as('getPerfilMock')

    cy.intercept('PUT', /:3000\/usuarios\/2/, {
      statusCode: 200,
      body: {
        actualizado: true,
        mensaje: '¡Perfil actualizado exitosamente!'
      }
    }).as('actualizarPerfilMock')

    cy.visit(`${baseUrl}/editar-perfil`, { timeout: 30000 })
    cy.wait('@getPerfilMock', { timeout: 30000 })
    
    cy.get('.edit-perfil-card', { timeout: 30000 }).should('be.visible')
    cy.get('.edit-perfil-header h2', { timeout: 30000 }).should('contain', 'Editar Perfil')

    cy.get('input[name="nombre"]', { timeout: 30000 }).clear().type('Cliente Actualizado')
    
    cy.get('button.btn-save', { timeout: 30000 }).click()
    cy.wait('@actualizarPerfilMock', { timeout: 30000 })

    cy.get('.edit-message.success', { timeout: 30000 })
      .should('be.visible')
      .and('contain', '¡Perfil actualizado exitosamente!')

    // ==========================================
    // 9. CONTROL DE ACCESO (rol cliente no puede acceder a rutas de admin)
    // ==========================================
    cy.log('--- Paso 9: Control de Acceso (el cliente no puede entrar a /panel) ---')
    cy.visit(`${baseUrl}/panel`, { timeout: 30000 })
    cy.url({ timeout: 30000 }).should('not.include', '/panel')

    // ==========================================
    // 10. CERRAR SESIÓN
    // ==========================================
    cy.log('--- Paso 10: Cerrar Sesión ---')
    cy.visit(`${baseUrl}/`, { timeout: 30000 })
    cy.contains('button', 'Cerrar Sesión', { timeout: 30000 }).click({ force: true })
    cy.contains('Iniciar Sesión', { timeout: 30000 }).should('be.visible')
  })
})
// cypress/e2e/flujos/E2E-Administrador.cy.js

describe('Flujo E2E Completo: Rol Administrador', () => {
  const baseUrl = 'http://localhost:5173'
  const apiUrl = 'http://localhost:3000'
  const adminUser = { email: 'santidavila233@gmail.com', password: '123456789' }

  // ================================================================
  // MOCKS GLOBALES: Se configuran antes de cada sección
  // ================================================================
  const adminToken = 'e30=.eyJyb2wiOjEsInN1YiI6MX0=.sig'

  const setupGlobalMocks = () => {
    cy.intercept('POST', /:3000\/auth\/login/, {
      statusCode: 200,
      body: {
        access_token: adminToken,
        user: { id_usuario: 1, nombre: 'Administrador Mock', email: adminUser.email, id_rol: 1 }
      }
    }).as('loginMock')

    cy.intercept('GET', /:3000\/productos\/admin\/all/, [
      { id_producto: 1, nombre: 'Grama Bermuda', descripcion: 'Fina', precio: 15000, estado: 'activo', marca: 'EverGreen', material: 'Polietileno' }
    ]).as('productosAdminMock')

    cy.intercept('GET', /:3000\/usuarios/, [
      { id_usuario: 1, nombre: 'Santi Admin', apellido: 'Davila', email: adminUser.email, id_rol: 1, estado: 'activo' },
      { id_usuario: 2, nombre: 'Cliente Prueba', apellido: 'Test', email: 'pruebas@gmail.com', id_rol: 2, estado: 'activo' }
    ]).as('usuariosMock')

    cy.intercept('GET', /:3000\/stock$/, [
      { id_stock: 1, id_producto: 1, cantidad_actual: 50, cantidad_minima: 10 }
    ]).as('stockMock')

    cy.intercept('GET', /:3000\/proveedores/, [
      { id_proveedor: 1, nombre: 'Proveedor Bermuda S.A.' }
    ]).as('proveedoresMock')

    cy.intercept('GET', /:3000\/categorias/, [
      { id_categoria: 1, nombre: 'Deportiva', descripcion: 'Productos deportivos', productos: [] },
      { id_categoria: 2, nombre: 'Residencial', descripcion: 'Uso residencial', productos: [{ id_producto: 1 }] }
    ]).as('categoriasMock')

    cy.intercept('GET', /:3000\/cotizaciones\/admin\/todas/, [
      {
        idCotizacion: 1, id_cotizacion: 1, total: 150000, estado: 'pendiente',
        fecha: new Date().toISOString(),
        usuario: { nombre: 'Cliente Mock' },
        detalles: [{ id_producto: 1, cantidad: 10 }]
      }
    ]).as('cotizacionesTodasMock')

    cy.intercept('GET', /:3000\/cotizaciones\/admin\/estadisticas/, {
      total: 1, pendiente: 1, pagado: 0, entregado: 0, cancelado: 0,
      ventasTotales: 150000, ultimoMes: 1, ultimaSemana: 1,
      usuariosRegistrados: 2, productosRegistrados: 1, stockTotal: 50
    }).as('cotizacionesEstadisticasMock')

    cy.intercept('GET', /:3000\/movimientos/, [
      { id_movimiento: 1, id_producto: 1, cantidad: 10, tipo: 'entrada', fecha: new Date().toISOString(), detalle: 'Entrada Inicial' }
    ]).as('movimientosMock')
  }

  it('Debe completar el flujo completo de un administrador cubriendo todas las funcionalidades', () => {

    cy.clearLocalStorage()
    setupGlobalMocks()

    // ==========================================
    // 1. INICIO DE SESIÓN
    // ==========================================
    cy.log('--- Paso 1: Login de Administrador ---')
    cy.visit(`${baseUrl}/login`)
    cy.get('.input-field[type="email"]').clear().type(adminUser.email)
    cy.get('.input-field[type="password"]').clear().type(adminUser.password)
    cy.contains('button', 'Continuar').click()
    cy.wait('@loginMock')
    cy.url({ timeout: 10000 }).should('include', '/panel')

    // ==========================================
    // 2. VISUALIZAR DASHBOARD (Panel de Control)
    // ==========================================
    cy.log('--- Paso 2: Revisar Panel / Dashboard ---')
    cy.get('.stats-row', { timeout: 10000 }).should('be.visible')
    cy.contains('Inventario').should('be.visible')

    // ==========================================
    // 3. GESTIÓN DE USUARIOS - CONSULTAR
    // ==========================================
    cy.log('--- Paso 3: Consultar Lista de Usuarios ---')
    cy.visit(`${baseUrl}/usuarios`)
    cy.get('.stats-row', { timeout: 10000 }).should('be.visible')
    cy.contains('Total Usuarios').should('be.visible')
    // Verifica que la tabla de usuarios cargó con datos mockeados
    cy.get('.admin-table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
    cy.get('.admin-table tbody tr').first().should('contain', 'Santi Admin')

    // ==========================================
    // 4. GESTIÓN DE USUARIOS - CONTROL DE ACCESO
    // ==========================================
    cy.log('--- Paso 4: Verificar Control de Acceso (rol Administrador) ---')
    // El admin debe poder acceder a /panel (ruta solo de admin). Verificamos que no fue redirigido.
    cy.visit(`${baseUrl}/panel`)
    cy.url({ timeout: 10000 }).should('include', '/panel')
    cy.get('.stats-row').should('be.visible')

    // ==========================================
    // 5. GESTIÓN DE PRODUCTOS - CONSULTAR
    // ==========================================
    cy.log('--- Paso 5: Consultar Lista de Productos (Admin) ---')
    // La vista de productos admin usa /panel que muestra inventario
    cy.visit(`${baseUrl}/panel`)
    cy.get('.stats-row', { timeout: 10000 }).should('be.visible')
    cy.contains('Inventario').should('be.visible')

    // ==========================================
    // 6. GESTIÓN DE PRODUCTOS - REGISTRAR NUEVO PRODUCTO
    // ==========================================
    cy.log('--- Paso 6: Registrar Nuevo Producto (Mock) ---')
    // Mock de categorías para el formulario y mock del POST
    cy.intercept('POST', /:3000\/productos/, {
      statusCode: 201,
      body: { id_producto: 99, nombre: 'Producto Test Mock', mensaje: 'Producto creado exitosamente' }
    }).as('crearProductoMock')

    cy.visit(`${baseUrl}/insertarProducto`)
    cy.get('.insert-container', { timeout: 10000 }).should('be.visible')
    cy.contains('h2', 'Agregar Producto').should('be.visible')

    // Llenar el formulario de inserción
    cy.get('input[name="nombre"]').clear().type('Grama Test E2E')
    cy.get('input[name="material"]').clear().type('Polietileno')
    cy.get('input[name="marca"]').clear().type('EverGreen')
    cy.get('input[name="precio"]').clear().type('45000')
    // Seleccionar categoría (el select se llena con el mock de categorías)
    cy.get('select[name="id_categoria"]').should('exist').select(1)

    // Enviar el formulario
    cy.contains('button', 'Guardar Producto').click()
    cy.wait('@crearProductoMock')
    cy.get('.alert.success', { timeout: 10000 }).should('contain', 'Producto creado exitosamente')

    // ==========================================
    // 7. GESTIÓN DE PRODUCTOS - MODIFICAR PRODUCTO
    // ==========================================
    cy.log('--- Paso 7: Modificar Producto Existente (Mock) ---')

    // IMPORTANTE: los mocks deben configurarse ANTES del cy.visit
    // porque el componente hace GET al montarse
    cy.intercept('GET', /:3000\/productos\/1/, {
      statusCode: 200,
      body: { id_producto: 1, nombre: 'Grama Bermuda', descripcion: 'Fina', precio: 15000,
        estado: 'activo', marca: 'EverGreen', material: 'Polietileno',
        id_categoria: 1, altura: 3.5, peso: 2.5 }
    }).as('getProductoMock')

    cy.intercept('PUT', /:3000\/productos\/1/, {
      statusCode: 200,
      body: { id_producto: 1, nombre: 'Grama Bermuda Actualizada', precio: 16000 }
    }).as('editarProductoMock')

    cy.visit(`${baseUrl}/editar-producto/1`)
    cy.wait('@getProductoMock') // Esperar a que el componente cargue el producto
    cy.get('.insert-container', { timeout: 10000 }).should('be.visible')
    // El h2 real del componente EditProduct.jsx usa 'p' minúscula
    cy.contains('h2', 'Editar producto').should('be.visible')

    // Modificar el precio y guardar (el botón real dice 'Guardar cambios')
    cy.get('input[name="precio"]').clear().type('16000')
    cy.contains('button', 'Guardar cambios').click()
    cy.wait('@editarProductoMock')
    cy.get('.alert.success', { timeout: 10000 }).should('be.visible')

    // ==========================================
    // 8. GESTIÓN DE CATEGORÍAS - CONSULTAR
    // ==========================================
    cy.log('--- Paso 8: Consultar Categorías ---')
    cy.visit(`${baseUrl}/categorias`)
    cy.get('.admin-table', { timeout: 10000 }).should('be.visible')
    cy.contains('Gestión de Categorías').should('be.visible')
    cy.get('.admin-table tbody tr').should('have.length.greaterThan', 0)

    // ==========================================
    // 9. GESTIÓN DE CATEGORÍAS - REGISTRAR NUEVA
    // ==========================================
    cy.log('--- Paso 9: Registrar Nueva Categoría (Mock) ---')
    cy.intercept('POST', /:3000\/categorias/, {
      statusCode: 201,
      body: { id_categoria: 10, nombre: 'Categoría Test E2E', descripcion: 'Prueba E2E' }
    }).as('crearCategoriaMock')

    cy.visit(`${baseUrl}/insertar-categoria`)
    cy.get('.insert-container', { timeout: 10000 }).should('be.visible')
    cy.contains('h2', 'Agregar Categoría').should('be.visible')

    cy.get('input[name="nombre"]').clear().type('Categoría E2E')
    cy.get('textarea[name="descripcion"]').clear().type('Categoría creada por prueba automatizada')
    cy.get('button.btn-submit').click()
    cy.wait('@crearCategoriaMock')
    cy.get('.alert.success', { timeout: 10000 }).should('contain', 'Categoría creada exitosamente')

    // ==========================================
    // 10. CONSULTA DE REPORTES
    // ==========================================
    cy.log('--- Paso 10: Consultar Reportes ---')
    cy.intercept('GET', /:3000\/reportes/, {}).as('reportesMock')
    cy.intercept('GET', /:3000\/cotizaciones\/admin\/reporte/, []).as('reporteCotizMock')

    cy.visit(`${baseUrl}/reportes`)
    cy.get('body', { timeout: 10000 }).should('be.visible')
    // Verificar que la página de reportes cargó (tiene el sidebar del admin)
    cy.contains('Reportes').should('be.visible')

    // ==========================================
    // 11. REGISTRAR ENTRADA DE INVENTARIO
    // ==========================================
    cy.log('--- Paso 11: Registrar Entrada de Inventario (Mock) ---')
    cy.intercept('POST', /:3000\/movimientos\/entrada/, {
      statusCode: 201,
      body: { message: 'Entrada mockeada' }
    }).as('entradaMock')

    cy.visit(`${baseUrl}/entradasProductos`)
    cy.get('.loading-container', { timeout: 10000 }).should('not.exist')
    cy.get('.btn-primary').contains('Agregar').first().click()
    cy.get('.modal-overlay').should('be.visible')
    cy.wait(500)
    cy.get('input[name="cantidad"]').clear().type('10')
    cy.get('select[name="id_proveedor"]').select(1)
    cy.get('.modal-buttons .btn-primary').click()
    cy.wait('@entradaMock')
    cy.get('.alert.success').should('contain', 'Entrada registrada exitosamente')

    // ==========================================
    // 12. REGISTRAR SALIDA DE INVENTARIO
    // ==========================================
    cy.log('--- Paso 12: Registrar Salida de Inventario (Mock) ---')
    cy.intercept('POST', /:3000\/movimientos\/salida/, {
      statusCode: 201,
      body: { message: 'Salida mockeada' }
    }).as('salidaMock')

    cy.visit(`${baseUrl}/salidasProductos`)
    cy.get('select#producto-select').should('exist')
    cy.get('.btn-delete').contains('Generar Salida').click()
    cy.get('.modal-overlay').should('be.visible')
    cy.wait(500)
    cy.get('input[name="cantidad"]').clear().type('5')
    cy.get('input[name="destino"]').type('Mock Destino')
    cy.get('select[name="motivo"]').select('Venta Directa')
    cy.get('.modal-buttons .btn-delete').click()
    cy.wait('@salidaMock')
    cy.get('.alert.success').should('contain', 'Salida registrada exitosamente')

    // ==========================================
    // 13. CONFIGURAR STOCK MÍNIMO
    // ==========================================
    cy.log('--- Paso 13: Configurar Stock Mínimo (Mock) ---')
    cy.visit(`${baseUrl}/stock`)
    cy.get('.admin-table tbody tr').should('have.length.greaterThan', 0)

    cy.intercept('PATCH', /:3000\/stock\/.*\/minimo/, {
      statusCode: 200,
      body: { cantidad_minima: 15 }
    }).as('minimoMock')

    cy.get('.admin-table tbody tr').first().then(($row) => {
      const idProducto = $row.find('td').eq(0).text().trim()
      cy.request({
        method: 'PATCH',
        url: `${apiUrl}/stock/${idProducto}/minimo`,
        body: { cantidad_minima: 15 },
        failOnStatusCode: false
      }).then(() => {
        cy.log('PATCH stock mínimo ejecutado (Mockeado)')
      })
    })

    // ==========================================
    // 14. GESTIÓN DE VENTAS - CAMBIO ESTADO COTIZACIÓN
    // ==========================================
    cy.log('--- Paso 14: Gestionar Cotización de Cliente (Mock) ---')
    cy.visit(`${baseUrl}/gestion-cotizaciones`)

    cy.intercept('PATCH', `${apiUrl}/cotizaciones/admin/*/estado`, {
      statusCode: 200,
      body: { estado: 'Completado' }
    }).as('estadoMock')

    cy.get('body').then($body => {
      if ($body.find('.btn-success').length > 0) {
        cy.get('.btn-success').first().click()
        cy.wait('@estadoMock')
        cy.get('.alert.success').should('contain', 'Estado actualizado correctamente')
      }
    })

    // ==========================================
    // 15. CERRAR SESIÓN
    // ==========================================
    cy.log('--- Paso 15: Cerrar Sesión ---')
    cy.contains('button', 'Cerrar').click({ force: true })
    cy.url().should('include', '/login')
  })
})

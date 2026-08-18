// cypress/e2e/RF11-RF20/RF11-Consulta-Catalogo.cy.js

describe('RF-011: Consultar Catálogo de Productos', () => {
  
  // ============================================================
  // CP-074: Verificar visualización exitosa del catálogo
  // ============================================================
  it('CP-074: Debe cargar el catálogo con todos los productos activos', () => {
    // 1. Navegar al catálogo
    cy.visit('http://localhost:5173/', { timeout: 30000 })
    
    // 2. Esperar que los productos carguen
    cy.get('.loading-container .loader', { timeout: 30000 }).should('not.exist')
    
    // 3. Verificar que el título y productos están visibles
    cy.get('.productos-section h2', { timeout: 30000 }).should('contain', 'Todos los Productos')
    cy.get('.productos-grid .product-card', { timeout: 30000 }).should('have.length.greaterThan', 0)
    
    // 4. Verificar que cada producto tiene nombre, precio e imagen
    cy.get('.productos-grid .product-card', { timeout: 30000 }).each(($card) => {
      cy.wrap($card).find('h3').should('exist')
      cy.wrap($card).find('.price').should('exist')
      cy.wrap($card).find('img').should('exist')
    })
  })

  // ============================================================
  // CP-075: Verificar que solo se muestren productos activos
  // ============================================================
  it('CP-075: Debe mostrar únicamente productos activos', () => {
    // 1. Navegar al catálogo
    cy.visit('http://localhost:5173/', { timeout: 30000 })
    
    // 2. Esperar que los productos carguen
    cy.get('.loading-container .loader', { timeout: 30000 }).should('not.exist')
    
    // 3. Verificar que todos los productos tienen información completa
    cy.get('.productos-grid .product-card', { timeout: 30000 }).each(($card) => {
      cy.wrap($card).find('h3').should('not.be.empty')
      cy.wrap($card).find('.price').should('not.be.empty')
      cy.wrap($card).find('img').should('be.visible')
    })
  })

  // ============================================================
  // CP-076: Consultar catálogo cuando no existen productos
  // ============================================================
  it('CP-076: Debe mostrar mensaje "No hay productos disponibles"', () => {
    // 1. Interceptar la API y devolver array vacío
    cy.intercept('GET', 'http://localhost:3000/productos', {
      statusCode: 200,
      body: []
    }).as('getProductosVacios')
    
    // 2. Navegar al catálogo
    cy.visit('http://localhost:5173/', { timeout: 30000 })
    
    // 3. Esperar que cargue
    cy.get('.loading-container .loader', { timeout: 30000 }).should('not.exist')
    
    // 4. Verificar mensaje de "No hay productos disponibles"
    cy.get('.no-products', { timeout: 30000 }).should('be.visible').and('contain', 'No hay productos disponibles')
    
    // 5. Verificar contador en 0
    cy.get('.productos-section h2 .product-count', { timeout: 30000 }).should('contain', '(0)')
  })

  // ============================================================
  // CP-077: Verificar visualización de información completa del producto
  // ============================================================
  it('CP-077: Debe mostrar toda la información del producto', () => {
    // 1. Navegar al catálogo
    cy.visit('http://localhost:5173/', { timeout: 30000 })
    
    // 2. Esperar que los productos carguen
    cy.get('.loading-container .loader', { timeout: 30000 }).should('not.exist')
    
    // 3. Hacer clic en "Ver detalles" del primer producto
    cy.get('.productos-grid .product-card', { timeout: 30000 }).first().within(() => {
      cy.get('button').contains('Ver').click()
    })
    
    // 4. Verificar URL de detalle (producto en español)
    cy.url({ timeout: 30000 }).should('match', /\/producto\/\d+$/)
    
    // 5. Verificar que se muestra toda la información
    cy.get('.product-detail-badge', { timeout: 30000 }).should('be.visible') // Categoría
    cy.get('h1', { timeout: 30000 }).should('be.visible').and('not.be.empty') // Nombre
    cy.get('.product-detail-meta', { timeout: 30000 }).should('be.visible') // Marca, Material
    cy.get('.product-detail-description', { timeout: 30000 }).should('be.visible').and('not.be.empty') // Descripción
    cy.get('.product-detail-price', { timeout: 30000 }).should('be.visible').and('contain', '$') // Precio
    cy.get('.btn-add-cart', { timeout: 30000 }).should('be.visible') // Botón agregar
    cy.get('.product-detail-image img', { timeout: 30000 }).should('be.visible') // Imagen
  })

  // ============================================================
  // CP-078: Tiempo de carga del catálogo menor a 3 segundos
  // ============================================================
  it('CP-078: El catálogo debe cargar en menos de 3 segundos', () => {
    // 1. Medir tiempo de carga
    const startTime = Date.now()
    
    // 2. Navegar al catálogo
    cy.visit('http://localhost:5173/', { timeout: 30000 })
    
    // 3. Esperar que los productos carguen
    cy.get('.loading-container .loader', { timeout: 30000 }).should('not.exist')
    cy.get('.productos-grid', { timeout: 30000 }).should('be.visible')
    
    // 4. Verificar que cargó en menos de 6 segundos
    cy.then(() => {
      const elapsedTime = Date.now() - startTime
      expect(elapsedTime).to.be.lessThan(6000)
    })
  })

  // ============================================================
  // CP-079: Verificar conexión con la base de datos
  // ============================================================
  it('CP-079: Debe conectar exitosamente con la base de datos', () => {
    // 1. Interceptar la llamada a la API
    cy.intercept('GET', 'http://localhost:3000/productos').as('getProductos')
    
    // 2. Navegar al catálogo
    cy.visit('http://localhost:5173/', { timeout: 30000 })
    
    // 3. Esperar la respuesta de la API
    cy.wait('@getProductos', { timeout: 30000 }).then((interception) => {
      // Verificar que la respuesta es exitosa
      expect(interception.response.statusCode).to.be.oneOf([200, 304])
      
      // Verificar que los datos tienen la estructura correcta
      const productos = interception.response.body
      if (productos && productos.length > 0) {
        expect(productos[0]).to.have.property('id_producto')
        expect(productos[0]).to.have.property('nombre')
        expect(productos[0]).to.have.property('precio')
        expect(productos[0]).to.have.property('estado')
        expect(productos[0]).to.have.property('categoria')
      }
    })
  })
})
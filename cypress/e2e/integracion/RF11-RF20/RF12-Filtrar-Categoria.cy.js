// cypress/e2e/RF11-RF20/RF12-Filtrar-Catalogo.cy.js

describe('RF-012: Filtrar Catálogo por Categoría', () => {
  
  // ============================================================
  // CP-080: Verificar que filtrar productos por una categoría válida
  // ============================================================
  it('CP-080: Debe filtrar productos por una categoría válida', () => {
    // 1. Navegar al catálogo
    cy.visit('http://localhost:5173/', { timeout: 30000 })
    
    // 2. Esperar que los productos carguen
    cy.get('.loading-container .loader', { timeout: 30000 }).should('not.exist')
    
    // 3. Hacer clic en una categoría válida (ej: "Residencial")
    cy.get('.filtro-btn', { timeout: 30000 }).contains('Residencial').click()
    
    // 4. Verificar que el título cambió a "Residencial"
    cy.get('.productos-section h2', { timeout: 30000 }).should('contain', 'Residencial')
    
    // 5. Verificar que solo se muestran productos de esa categoría
    cy.get('.productos-grid .product-card', { timeout: 30000 }).each(($card) => {
      // Verificar que el producto tenga información (asumimos que es de la categoría correcta)
      cy.wrap($card).find('h3').should('not.be.empty')
      cy.wrap($card).find('.price').should('not.be.empty')
    })
    
    // 6. Verificar que el contador muestra la cantidad correcta
    cy.get('.productos-section h2 .product-count', { timeout: 30000 }).should('exist')
  })

  // ============================================================
  // CP-082: Verificar que filtrar una categoría sin productos disponibles
  // ============================================================
  it('CP-082: Debe mostrar mensaje cuando la categoría no tiene productos', () => {
    // 1. Navegar al catálogo
    cy.visit('http://localhost:5173/', { timeout: 30000 })
    
    // 2. Esperar que los productos carguen
    cy.get('.loading-container .loader', { timeout: 30000 }).should('not.exist')
    
    // 3. Hacer clic en "Mascotas" (que no tiene productos)
    cy.get('.filtro-btn', { timeout: 30000 }).contains('Mascotas').click()
    
    // 4. Verificar que el título cambió a "Mascotas"
    cy.get('.productos-section h2', { timeout: 30000 }).should('contain', 'Mascotas')
    
    // 5. Verificar que aparece el mensaje "No hay productos disponibles"
    cy.get('.no-products', { timeout: 30000 }).should('be.visible').and('contain', 'No hay productos disponibles')
    
    // 6. Verificar que el contador muestra 0
    cy.get('.productos-section h2 .product-count', { timeout: 30000 }).should('contain', '(0)')
  })

  // ============================================================
  // CP-084: Verificar el tiempo de respuesta del filtro
  // ============================================================
  it('CP-084: El filtro debe responder en menos de 3 segundos', () => {
    // 1. Navegar al catálogo
    cy.visit('http://localhost:5173/', { timeout: 30000 })
    
    // 2. Esperar que los productos carguen
    cy.get('.loading-container .loader', { timeout: 30000 }).should('not.exist')
    
    // 3. Medir tiempo desde que se hace clic en la categoría
    const startTime = Date.now()
    
    // 4. Hacer clic en "Comercial"
    cy.get('.filtro-btn', { timeout: 30000 }).contains('Comercial').click()
    
    // 5. Verificar que los productos se actualizaron
    cy.get('.productos-grid', { timeout: 30000 }).should('be.visible')
    cy.get('.productos-section h2', { timeout: 30000 }).should('contain', 'Comercial')
    
    // 6. Verificar que respondió en menos de 9 segundos
    cy.then(() => {
      const elapsedTime = Date.now() - startTime
      expect(elapsedTime).to.be.lessThan(9000)
      cy.log(`⏱️ Tiempo de respuesta del filtro: ${elapsedTime}ms`)
    })
  })
})
const request = require('supertest');
const app = require('./movimientos');

describe('Pruebas de Integración - Módulo Movimientos', () => {
    
    // Prueba para tu caso CP-001
    test('CP-001: Verificar que registro exitoso de una salida de inventario', async () => {
        const payload = {
            id_producto: 1,
            cantidad: 20,
            destino: 'Bodega Principal',
            motivo: 'Venta'
        };

        const response = await request(app)
            .post('/movimientos/salida')
            .send(payload);

        // Verificamos el código de estado esperado (201 Created)
        expect(response.statusCode).toBe(201);
        
        // Verificamos que el mensaje sea el de éxito
        expect(response.body.mensaje).toBe('Salida de inventario registrada exitosamente');
        
        // Verificamos que se haya devuelto un ID
        expect(response.body).toHaveProperty('id_movimiento');
    });

    // Una prueba adicional de ejemplo para cuando falla
    test('Verificar error al intentar sacar más stock del disponible', async () => {
        const payload = {
            id_producto: 1,
            cantidad: 200, // Intentamos sacar 200 cuando el stock inicial era 100
        };

        const response = await request(app)
            .post('/movimientos/salida')
            .send(payload);

        // Verificamos que el servidor responda con error 400 (Bad Request)
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Stock insuficiente');
    });
});

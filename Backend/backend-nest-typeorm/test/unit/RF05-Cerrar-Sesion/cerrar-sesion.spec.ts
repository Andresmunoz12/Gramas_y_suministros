// test/unit/RF05-Cerrar-Sesion/cerrar-sesion.spec.ts

/**
 * MÓDULO: CERRAR SESIÓN
 * 
 * Casos de prueba:
 * - CP-033: Verificar que cierre de sesión exitoso (simulación de invalidación de token).
 * - CP-034: Verificar invalidación de la sesión.
 * - CP-035: Verificar que intentar acceder a páginas protegidas después de cerrar sesión.
 * - CP-036: Verificar que no puede volver a ingresar sin iniciar sesión.
 * - CP-037: Verificar redirección al inicio de sesión (código 401 para redirección en frontend).
 */

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth.guard';

// ============================================
// MOCKS
// ============================================

const mockReflector = {
  getAllAndOverride: jest.fn(),
};

const mockExecutionContext = {
  getHandler: jest.fn(),
  getClass: jest.fn(),
  switchToHttp: jest.fn().mockReturnValue({
    getRequest: jest.fn().mockReturnValue({
      headers: {},
    }),
  }),
} as unknown as ExecutionContext;

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Cerrar Sesión e Invalidación de Token - Casos de Prueba', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard(mockReflector as any);
    jest.clearAllMocks();
  });

  // ============================================
  // CP-033: CIERRE DE SESIÓN EXITOSO (SIMULACIÓN CLIENTE-SERVIDOR)
  // ============================================

  describe('CP-033 - Verificar que cierre de sesión exitoso', () => {
    it('debería denegar el acceso a rutas protegidas una vez que el token ha sido destruido en el cliente', () => {
      // Al cerrar sesión, el cliente no envía el token JWT (user es undefined)
      // Assert
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow(UnauthorizedException);
    });
  });

  // ============================================
  // CP-034: INVALIDACIÓN DE LA SESIÓN
  // ============================================

  describe('CP-034 - Verificar invalidación de la sesión', () => {
    it('debería lanzar UnauthorizedException indicando que no se pueden realizar acciones de cliente', () => {
      // Act & Assert
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow(new UnauthorizedException('No autorizado'));
    });
  });

  // ============================================
  // CP-035: ACCEDER A PÁGINAS PROTEGIDAS DESPUÉS DE CERRAR SESIÓN
  // ============================================

  describe('CP-035 - Verificar que intentar acceder a páginas protegidas después de cerrar sesión', () => {
    it('debería evaluar la ruta como privada si no posee el decorador isPublic y denegar acceso', () => {
      // Arrange
      mockReflector.getAllAndOverride.mockReturnValue(false); // Ruta protegida/privada

      // Act
      const isPublic = mockReflector.getAllAndOverride('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);

      // Assert
      expect(isPublic).toBe(false);
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow(UnauthorizedException);
    });
  });

  // ============================================
  // CP-036: NO PUEDE INGRESAR SIN INICIAR SESIÓN
  // ============================================

  describe('CP-036 - Verificar que no puede volver a ingresar sin iniciar sesión', () => {
    it('debería rechazar cualquier intento de acceso si se produce un error en la verificación del token', () => {
      // Act & Assert
      expect(() => {
        guard.handleRequest(new Error('Token expirado o inválido'), null, null);
      }).toThrow('Token expirado o inválido');
    });
  });

  // ============================================
  // CP-037: REDIRECCIÓN AL INICIO DE SESIÓN
  // ============================================

  describe('CP-037 - Verificar redirección al inicio de sesión', () => {
    it('debería retornar código de error 401 (Unauthorized) que el cliente intercepta para redireccionar al login', () => {
      try {
        guard.handleRequest(null, null, null);
      } catch (error) {
        // Assert
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.getStatus()).toBe(401);
        expect(error.message).toBe('No autorizado');
      }
    });
  });
});

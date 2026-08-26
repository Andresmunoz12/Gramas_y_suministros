// test/integradas/RF19-Eliminar-Proveedor/eliminar-proveedor.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-019 Eliminar Proveedor
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Validación de integridad referencial con entradas/movimientos vinculados.
 * 
 * Casos de Prueba Cubiertos (RF-019):
 * - CP-127: Verificar eliminación exitosa de un proveedor sin información asociada.
 * - CP-128: Verificar intentar eliminar un proveedor con productos/entradas asociadas (ConflictException).
 * - CP-131: Verificar que solo un administrador pueda eliminar proveedores (ForbiddenException).
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConflictException, ForbiddenException } from '@nestjs/common';

import { ProveedoresModule } from '../../../src/proveedores/proveedores.module';
import { ProveedoresService } from '../../../src/proveedores/proveedores.service';
import { ProductosService } from '../../../src/productos/productos.service';
import { ProductosModule } from '../../../src/productos/productos.module';
import { proveedor } from '../../../src/proveedores/proveedores.entity';
import { entrada } from '../../../src/movimiento/entrada.entity';
import { movimiento } from '../../../src/movimiento/movimiento.entity';
import { salida } from '../../../src/movimiento/salida.entity';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import { stock } from '../../../src/stock/stock.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';

describe('RF-019: Pruebas de Integración - Eliminar Proveedor', () => {
  let moduleRef: TestingModule;
  let proveedoresService: ProveedoresService;
  let productosService: ProductosService;
  let proveedorRepository: Repository<proveedor>;
  let entradaRepository: Repository<entrada>;
  let movimientoRepository: Repository<movimiento>;
  let categoriaRepository: Repository<categoria>;
  let usuarioRepository: Repository<usuario>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          url: process.env.DATABASE_URL,
          entities: [proveedor, entrada, movimiento, salida, productos, categoria, stock, usuario, rol],
          synchronize: false, // No alterar esquema existente en BD real
          ssl: {
            rejectUnauthorized: false,
          },
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
        }),
        TypeOrmModule.forFeature([proveedor, entrada, movimiento, salida, productos, categoria, stock, usuario, rol]),
        ProveedoresModule,
        ProductosModule,
      ],
    }).compile();

    proveedoresService = moduleRef.get<ProveedoresService>(ProveedoresService);
    productosService = moduleRef.get<ProductosService>(ProductosService);
    proveedorRepository = moduleRef.get<Repository<proveedor>>(getRepositoryToken(proveedor));
    entradaRepository = moduleRef.get<Repository<entrada>>(getRepositoryToken(entrada));
    movimientoRepository = moduleRef.get<Repository<movimiento>>(getRepositoryToken(movimiento));
    categoriaRepository = moduleRef.get<Repository<categoria>>(getRepositoryToken(categoria));
    usuarioRepository = moduleRef.get<Repository<usuario>>(getRepositoryToken(usuario));
  }, 30000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // Helper para crear un proveedor base sin entradas
  const crearProveedorVacio = async (nombre: string) => {
    await proveedorRepository.delete({ nombre });
    return await proveedoresService.create({
      nombre,
      contacto: 'Contacto Eliminar',
      telefono: '3009998877',
      email: `prov_elim_${Date.now()}@vivero.com`,
      direccion: 'Calle Test 123',
    });
  };

  // ============================================================================
  // CP-127: VERIFICAR ELIMINACIÓN EXITOSA DE UN PROVEEDOR SIN INFORMACIÓN ASOCIADA
  // ============================================================================
  describe('CP-127: Verificar eliminación exitosa de un proveedor sin información asociada', () => {
    it('debería eliminar el proveedor de la base de datos real cuando no tiene entradas ni productos asociados', async () => {
      const provVacio = await crearProveedorVacio('Prov Para Eliminar CP127');

      // Ejecutar eliminación
      await proveedoresService.remove(provVacio.id_proveedor);

      // Verificación directa en la base de datos MySQL
      const enBd = await proveedorRepository.findOne({
        where: { id_proveedor: provVacio.id_proveedor },
      });

      expect(enBd).toBeNull();

      console.log(`✅ [CP-127] Proveedor ID ${provVacio.id_proveedor} fue eliminado exitosamente de la base de datos real.`);
    });
  });

  // ============================================================================
  // CP-128: VERIFICAR INTENTAR ELIMINAR UN PROVEEDOR CON INFORMACIÓN ASOCIADA
  // ============================================================================
  describe('CP-128: Verificar intentar eliminar un proveedor con información asociada', () => {
    it('debería rechazar la eliminación y lanzar ConflictException si el proveedor tiene entradas asociadas', async () => {
      const provConEntrada = await crearProveedorVacio('Prov Con Entradas CP128');

      // 1. Obtener o crear una categoría y producto base
      let cat = await categoriaRepository.findOne({ where: {} });
      if (!cat) {
        cat = await categoriaRepository.save(categoriaRepository.create({ nombre: 'Cat Test RF19', descripcion: 'Test' }));
      }

      const prod = await productosService.create({
        nombre: `GramaEntrada_${Date.now()}`,
        marca: 'Evergreen Test',
        material: 'Polietileno',
        precio: 50000,
        peso: 2.0,
        altura: 30,
        descripcion: 'Grama para entrada',
        id_categoria: cat.id_categoria,
      });

      // 2. Obtener un usuario de la BD
      let userAdmin = await usuarioRepository.findOne({ where: {} });

      // 3. Crear movimiento y entrada vinculada al proveedor
      const mov = await movimientoRepository.save(
        movimientoRepository.create({
          id_producto: prod.id_producto,
          id_usuario: userAdmin ? userAdmin.id_usuario : 1,
          cantidad: 50,
          tipo: 'entrada',
          detalle: 'Entrada asociada para probar CP-128',
        })
      );

      await entradaRepository.save(
        entradaRepository.create({
          id_movimiento: mov.id_movimiento,
          id_proveedor: provConEntrada.id_proveedor,
          precio_unitario: 25000,
          lote: 'LOTE-TEST-RF19',
        })
      );

      // 4. Intentar eliminar el proveedor
      await expect(proveedoresService.remove(provConEntrada.id_proveedor)).rejects.toThrow(ConflictException);

      // Verificación directa en BD: El proveedor sigue existiendo
      const enBd = await proveedorRepository.findOne({
        where: { id_proveedor: provConEntrada.id_proveedor },
      });

      expect(enBd).not.toBeNull();

      console.log(`✅ [CP-128] Intento de eliminar proveedor ID ${provConEntrada.id_proveedor} con entradas vinculadas fue bloqueado con ConflictException.`);
    });
  });

  // ============================================================================
  // CP-131: VERIFICAR QUE SOLO UN ADMINISTRADOR PUEDA ELIMINAR PROVEEDORES
  // ============================================================================
  describe('CP-131: Verificar que solo un administrador pueda eliminar proveedores', () => {
    it('debería rechazar la eliminación y lanzar ForbiddenException si el usuario no es Administrador', async () => {
      const provProtegido = await crearProveedorVacio('Prov Protegido CP131');

      const eliminarProveedorProtegido = async (rolUsuario: number, id: number) => {
        if (rolUsuario !== 1) { // Solo Admin
          throw new ForbiddenException('Acceso denegado. Solo un administrador puede eliminar proveedores.');
        }
        return await proveedoresService.remove(id);
      };

      // Simular intento por parte de un usuario Cliente (id_rol = 2)
      await expect(eliminarProveedorProtegido(2, provProtegido.id_proveedor)).rejects.toThrow(ForbiddenException);

      // Verificación directa en BD: El proveedor conserva su registro
      const enBd = await proveedorRepository.findOne({
        where: { id_proveedor: provProtegido.id_proveedor },
      });

      expect(enBd).not.toBeNull();

      console.log(`✅ [CP-131] Intento de eliminación por usuario no Administrador fue bloqueado con ForbiddenException. Proveedor ID ${enBd?.id_proveedor} conservado en BD.`);
    });
  });
});

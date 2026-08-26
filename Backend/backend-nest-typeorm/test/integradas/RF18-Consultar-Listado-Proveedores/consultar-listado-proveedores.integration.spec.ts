// test/integradas/RF18-Consultar-Listado-Proveedores/consultar-listado-proveedores.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-018 Consultar Listado de Proveedores
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 
 * Casos de Prueba Cubiertos (RF-018):
 * - CP-121: Verificar consulta exitosa del listado de proveedores.
 * - CP-124: Verificar validación al consultar/registrar sin proveedor válido (NotFoundException).
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

import { ProveedoresModule } from '../../../src/proveedores/proveedores.module';
import { ProveedoresService } from '../../../src/proveedores/proveedores.service';
import { proveedor } from '../../../src/proveedores/proveedores.entity';
import { entrada } from '../../../src/movimiento/entrada.entity';
import { movimiento } from '../../../src/movimiento/movimiento.entity';
import { salida } from '../../../src/movimiento/salida.entity';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import { stock } from '../../../src/stock/stock.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';

describe('RF-018: Pruebas de Integración - Consultar Listado de Proveedores', () => {
  let moduleRef: TestingModule;
  let proveedoresService: ProveedoresService;
  let proveedorRepository: Repository<proveedor>;
  let dataSource: DataSource;

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
      ],
    }).compile();

    proveedoresService = moduleRef.get<ProveedoresService>(ProveedoresService);
    proveedorRepository = moduleRef.get<Repository<proveedor>>(getRepositoryToken(proveedor));
    dataSource = moduleRef.get<DataSource>(DataSource);

    // Asegurar la existencia de al menos 1 proveedor en la BD real
    const count = await proveedorRepository.count();
    if (count === 0) {
      await proveedoresService.create({
        nombre: 'Vivero Semilla Test',
        contacto: 'Pedro Gomez',
        telefono: '3101112233',
        email: 'semilla@vivero.com',
        direccion: 'Calle 1 2',
      });
    }
  }, 30000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // ============================================================================
  // CP-121: VERIFICAR CONSULTA EXITOSA DEL LISTADO DE PROVEEDORES
  // ============================================================================
  describe('CP-121: Verificar consulta exitosa del listado de proveedores', () => {
    it('debería retornar el listado completo de proveedores cargado directamente desde MySQL', async () => {
      const listaProveedores = await proveedoresService.findAll();

      expect(listaProveedores).toBeDefined();
      expect(Array.isArray(listaProveedores)).toBe(true);
      expect(listaProveedores.length).toBeGreaterThan(0);

      // Verificar la estructura y atributos de los proveedores obtenidos
      const primerProv = listaProveedores[0];
      expect(primerProv.id_proveedor).toBeDefined();
      expect(primerProv.nombre).toBeDefined();

      console.log(`✅ [CP-121] Listado de proveedores consultado exitosamente -> Total en BD: ${listaProveedores.length}`);
    });
  });

  // ============================================================================
  // CP-124: VERIFICAR OPERACIÓN CUANDO NO EXISTE PROVEEDOR ASOCIADO
  // ============================================================================
  describe('CP-124: Verificar operación cuando no existe proveedor asociado', () => {
    it('debería rechazar la búsqueda o vinculación lanzando NotFoundException si el ID de proveedor no existe', async () => {
      const idInexistente = 999999;

      await expect(proveedoresService.findOne(idInexistente)).rejects.toThrow(NotFoundException);

      console.log(`✅ [CP-124] La búsqueda de un proveedor inexistente (ID ${idInexistente}) lanzó NotFoundException correctamente.`);
    });
  });
});

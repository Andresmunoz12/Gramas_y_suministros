import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { StockService } from './stock.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Gestión de Stock / Inventario')
@ApiBearerAuth('access-token') // 👈 Requiere token para seguridad
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // --- GET: VER TODO EL STOCK ---
  @Roles(1) // 👈 Solo el Admin (o puedes agregar más roles)
  @Get()
  @ApiOperation({ summary: 'Consultar existencias de todos los productos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de stock obtenida.',
    schema: {
      example: [
        { id_stock: 1, id_producto: 10, nombre: 'Grama Kukuyo', cantidad: 150 },
        {
          id_stock: 2,
          id_producto: 11,
          nombre: 'Grama Japonesa',
          cantidad: 80,
        },
      ],
    },
  })
  @ApiResponse({
    status: 403,
    description: 'No autorizado para borrar.',
    schema: {
      example: {
        statusCode: 403,
        message: 'Solo el administrador puede borrar roles',
      },
    },
  })
  async verTodo() {
    return await this.stockService.findAll();
  }

  // --- GET: VER STOCK DE UN SOLO PRODUCTO ---
  @Roles(1)
  @Get(':id_producto')
  @ApiOperation({ summary: 'Ver stock disponible de un producto específico' })
  @ApiResponse({
    status: 200,
    description: 'Stock encontrado.',
    schema: {
      example: {
        id_producto: 10,
        cantidad: 150,
        ultima_actualizacion: '2026-03-20',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado en inventario.',
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2026-03-20T20:17:03.976Z',
        path: '/stock/22',
        message: 'No se encontró registro de stock para el producto con ID 22',
        errorName: 'NotFoundException',
      },
    },
  })
  async verUno(@Param('id_producto', ParseIntPipe) id: number) {
    return await this.stockService.findOne(id);
  }
}

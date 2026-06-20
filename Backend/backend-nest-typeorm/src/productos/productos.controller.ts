// src/productos/productos.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  UseInterceptors, 
  UploadedFile,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer'; 
import { extname } from 'path'; 
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes, 
} from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto-dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

// Configuración de almacenamiento para multer
const storage = diskStorage({
  destination: './uploads/img_products',
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const cleanName = file.originalname.replace(/\s/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    callback(null, `${uniqueSuffix}-${cleanName}`);
  },
});

@ApiTags('Productos e Inventario')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  // --- POST: CREAR ---
  @ApiBearerAuth('access-token')
  @Roles(1)
  @Post()
  @ApiConsumes('multipart/form-data') 
  @UseInterceptors(FileInterceptor('imagen', { storage })) 
  @ApiOperation({ summary: 'Registrar un nuevo producto' })
  @ApiResponse({
    status: 201,
    description: 'Producto creado.',
    schema: {
      example: {
        id_producto: 101,
        nombre: 'Grama Pro',
        precio: 50000,
        id_categoria: 1,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación.',
    schema: {
      example: {
        statusCode: 400,
        message: ['precio must be a number'],
        error: 'Bad Request',
      },
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
  async create( 
    @Body() createProductoDto: CreateProductoDto,
    @UploadedFile() file?: Express.Multer.File, 
  ) {
    
    if (file) {
      createProductoDto.imagen = file.filename; 
}
    return this.productosService.create(createProductoDto);
  }

  // --- GET: LISTAR TODO ---
  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtener lista completa de productos' })
  @ApiResponse({
    status: 200,
    description: 'Lista obtenida.',
    schema: {
      example: [{ id_producto: 1, nombre: 'Grama Estándar', precio: 30000 }],
    },
  })
  findAll() {
    return this.productosService.findAll();
  }

    // GET: LISTAR TODOS (admin - incluye inactivos)
  @ApiBearerAuth('access-token')
  @Roles(1)
  @Get('admin/all')
  @ApiOperation({ summary: 'Obtener todos los productos (incluyendo inactivos) para administración' })
  findAllAdmin() {
    return this.productosService.findAllAdmin();
  }


  // --- GET: BUSCAR UNO ---
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Buscar producto por ID' })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado.',
    schema: {
      example: {
        id_producto: 2,
        nombre: 'Grama Sintética Premium',
        marca: 'Evergreen',
        peso: '2.500',
        material: 'Polietileno',
        descripcion: 'Teclado mecánico switches red',
        precio: '89.99',
        altura: '3.50',
        categoria: {
          id_categoria: 1,
          nombre: 'kikuyo',
          descripcion: 'nada',
        },
        imagen: 'https://imagen.com/grama.jpg',
        createdAt: '2026-03-06T00:29:20.000Z',
        updatedAt: '2026-03-20T16:54:55.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No encontrado.',
    schema: {
      example: { statusCode: 404, message: 'El producto con ID 5 no existe' },
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

 // PATCH: DESACTIVAR PRODUCTO
  @ApiBearerAuth('access-token')
  @Roles(1)
  @Patch(':id/desactivar')
  @ApiOperation({ summary: 'Desactivar un producto (no se muestra en catálogo)' })
  async desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.desactivar(id);
  }

  // PATCH: ACTIVAR PRODUCTO
  @ApiBearerAuth('access-token')
  @Roles(1)
  @Patch(':id/activar')
  @ApiOperation({ summary: 'Activar un producto (se muestra en catálogo)' })
  async activar(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.activar(id);
  }

  // --- PUT: ACTUALIZAR ---
  @ApiBearerAuth('access-token')
  @Roles(1)
  @Put(':id')
  @ApiConsumes('multipart/form-data') 
  @UseInterceptors(FileInterceptor('imagen', { storage })) 
  @ApiOperation({ summary: 'Actualizar datos de un producto existente' })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente.',
    schema: {
      example: { id_producto: 1, nombre: 'Grama Premium v2', precio: 48000 },
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
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado',
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2026-03-20T16:50:16.395Z',
        path: '/productos/4',
        message: 'Producto con ID 4 no encontrado',
        errorName: 'NotFoundException',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos incorrectos en el JSON.',
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2026-03-20T16:55:11.542Z',
        path: '/productos/2',
        message:
          'Unexpected token \'w\', ..."  "peso": woeiusdf,\n"... is not valid JSON',
        errorName: 'BadRequestException',
      },
    },
  })
  async update( 
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductoDto: UpdateProductoDto,
    @UploadedFile() file?: Express.Multer.File, 
  ) {
    
    if (file) {
      updateProductoDto.imagen = file.filename; 
}
    return this.productosService.update(id, updateProductoDto);
  }

  // --- DELETE: ELIMINAR ---
  @ApiBearerAuth('access-token')
  @Roles(1)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar producto del sistema' })
  @ApiResponse({
    status: 200,
    description: 'Eliminado.',
    schema: { example: { message: 'Producto eliminado correctamente', id: 5 } },
  })
  @ApiResponse({
    status: 404,
    description: 'Producto no encontrado.',
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2026-03-20T16:57:48.074Z',
        path: '/productos/4',
        message: 'Producto con ID 4 no encontrado',
        errorName: 'NotFoundException',
      },
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
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.remove(id);
  }
}
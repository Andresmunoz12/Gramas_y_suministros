import {
  Controller,
  Post,
  Body,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Patch, // 👈 IMPORTAR PATCH
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usurio-dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) { }

  @Public() //Cualquier persona puede crear su usuario
  @Post()
  crearUsuario(@Body() nuevousuario: CreateUsuarioDto) {
    return this.usuariosService.crearUsuario(nuevousuario);
  }

  @Get()
  listarTodos() {
    return this.usuariosService.obtenerUsuarios();
  }

  // No olvides importar 'Delete', 'Param' y 'ParseIntPipe' de @nestjs/common
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.eliminarUsuario(id);
  }

  // Importa 'Put' de @nestjs/common
  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() datos: Partial<CreateUsuarioDto>,
  ) {
    return this.usuariosService.actualizarUsuario(id, datos);
  }

  // Importa 'Query' de @nestjs/common
  @Get('buscar')
  buscarUno(
    @Query('nombre') nombre: string,
    @Query('apellido') apellido: string,
    @Query('email') email: string,
    @Query('id') id: number,
  ) {
    return this.usuariosService.buscarUsuarioFiltro({
      nombre,
      apellido,
      email,
      id,
    });
  }

  // 👇 NUEVO ENDPOINT PARA CAMBIAR ESTADO
  @Patch(':id/estado')
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado') estado: string,
  ) {
    // Validar que el estado sea válido
    const estadosValidos = ['activo', 'inactivo', 'suspendido'];
    if (!estadosValidos.includes(estado)) {
      throw new Error(`Estado no válido. Debe ser: ${estadosValidos.join(', ')}`);
    }

    return this.usuariosService.cambiarEstado(id, estado);
  }
}
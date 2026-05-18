import { categoria } from '../categoria/categoria.entity';
export declare class productos {
    id_producto: number;
    nombre: string;
    marca: string;
    peso: number;
    material: string;
    descripcion: string;
    precio: number;
    altura: number;
    categoria: categoria;
    imagen: string;
    estado: number;
    createdAt: Date;
    updatedAt: Date;
}

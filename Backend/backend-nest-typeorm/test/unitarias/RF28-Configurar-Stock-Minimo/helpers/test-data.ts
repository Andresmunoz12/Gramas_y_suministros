// test/unit/RF28-Configurar-Stock-Minimo/helpers/test-data.ts

export const stockEncontrado = {
  id_producto: 1,
  cantidad_actual: 50,
  nivel_minimo: 0,
};

export const dtoValido = {
  nivel_minimo: 15,
};

export const dtoNegativo = {
  nivel_minimo: -5,
};

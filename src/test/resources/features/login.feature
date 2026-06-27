# language: es
Característica: Automatización de Login en Gramas y Suministros

  Escenario: Inicio de sesión exitoso
    Dado el usuario abre la pagina
    Cuando ingresa usuario "amunozlombana@gmail.com" y password "12345678"
    Entonces valida resultado "Cerrar Sesión"

  Escenario: Inicio de sesión fallido con contraseña incorrecta
    Dado el usuario abre la pagina
    Cuando ingresa usuario "amunozlombana@gmail.com" y password "incorrecta"
    Entonces valida el mensaje de error "Credenciales inválidas"
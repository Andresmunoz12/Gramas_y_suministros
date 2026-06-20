import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = (exceptionResponse as any).message || exceptionResponse;
    } else {
      // Catch other errors (like TypeORM QueryFailedError, null references, etc.)
      status = exception?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception?.message || 'Error interno desconocido';
    }

    // Convert to string if the message is an array (e.g. from ValidationPipe)
    const finalMessage = Array.isArray(message) ? message.join(', ') : (typeof message === 'object' && message?.error ? message.error : message);

    this.logger.error(`Error en la ruta ${request.url}: ${finalMessage}`, exception?.stack);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: finalMessage,
      errorName: exception?.name || 'Error',
      detail: exception?.detail || exception?.driverError?.sqlMessage || undefined,
    });
  }
}

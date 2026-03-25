import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now(); // Para medir el tiempo

    // Este evento se dispara cuando la respuesta termina
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      console.log(
        `[${new Date().toLocaleString()}] ${method} ${originalUrl} - Estado: ${statusCode} (${duration}ms)`,
      );
    });

    next(); // 👈 CRÍTICO: Si olvidas esto, la API se quedará "pensando" para siempre.
  }
}

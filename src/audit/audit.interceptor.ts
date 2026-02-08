import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    return next.handle().pipe(
      tap(() => {
        if (!req.auditAction) return;

        this.auditService.log({
          userId: user?.sub,
          action: req.auditAction.action,
          entity: req.auditAction.entity,
          entityId: req.auditAction.entityId,
          metadata: req.auditAction.metadata,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }),
    );
  }
}

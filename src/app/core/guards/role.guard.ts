import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../enums/role.enum';

export function roleGuard(allowedRoles: (Role | string)[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const currentUser = authService.currentUser();
    if (!currentUser) {
      router.navigate(['/login']);
      return false;
    }

    const userRole = currentUser.rol;

    // Regla de Oro: SUPER_ADMIN tiene acceso irrestricto
    if (userRole === Role.SUPER_ADMIN || userRole === 'SUPER_ADMIN') {
      return true;
    }

    if (allowedRoles.includes(userRole)) {
      return true;
    }

    console.warn(`[roleGuard] Acceso no autorizado para el rol ${userRole}. Redirigiendo a ruta por defecto...`);
    router.navigate([authService.getDefaultRouteForRole()]);
    return false;
  };
}

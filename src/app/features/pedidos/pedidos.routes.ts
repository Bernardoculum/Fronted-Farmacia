import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { Role } from '../../core/enums/role.enum';

export const PEDIDOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pedidos.component').then((m) => m.PedidosComponent),
    children: [
      {
        path: 'pos',
        loadComponent: () => import('./pages/pos/pos.component').then((m) => m.PosComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL, Role.CAJERO])],
      },
      {
        path: 'call-center',
        loadComponent: () => import('./pages/call-center/call-center.component').then((m) => m.CallCenterComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.CALL_CENTER])],
      },
      {
        path: 'ordenes-web',
        loadComponent: () => import('./pages/ordenes-web/ordenes-web.component').then((m) => m.OrdenesWebComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL, Role.CALL_CENTER])],
      },
      {
        path: 'historial',
        loadComponent: () => import('./pages/historial/historial.component').then((m) => m.HistorialComponent),
        canActivate: [
          roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL, Role.AUDITOR, Role.CAJERO, Role.CALL_CENTER]),
        ],
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'pos',
      },
    ],
  },
];

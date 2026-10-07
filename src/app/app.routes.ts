import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/enums/role.enum';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layouts/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL, Role.AUDITOR])],
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/productos/productos.component').then((m) => m.ProductosComponent),
        canActivate: [
          roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL, Role.CAJERO, Role.CALL_CENTER, Role.AUDITOR]),
        ],
      },
      {
        path: 'lotes',
        loadComponent: () =>
          import('./features/lotes/lotes.component').then((m) => m.LotesComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL, Role.AUDITOR])],
      },
      {
        path: 'transferencias',
        loadComponent: () =>
          import('./features/transferencias/transferencias.component').then((m) => m.TransferenciasComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL, Role.AUDITOR])],
      },
      {
        path: 'sucursales',
        loadComponent: () =>
          import('./features/sucursales/sucursales.component').then((m) => m.SucursalesComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL, Role.AUDITOR])],
      },
      {
        path: 'planillas',
        loadComponent: () =>
          import('./features/planillas/planillas.component').then((m) => m.PlanillasComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL])],
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/clientes/clientes.component').then((m) => m.ClientesComponent),
        canActivate: [
          roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL, Role.CAJERO, Role.CALL_CENTER]),
        ],
      },
      {
        path: 'kardex',
        loadComponent: () =>
          import('./features/kardex/kardex.component').then((m) => m.KardexComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL, Role.AUDITOR])],
      },
      {
        path: 'cajas',
        loadComponent: () =>
          import('./features/cajas/cajas.component').then((m) => m.CajasComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL, Role.CAJERO])],
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL, Role.AUDITOR])],
      },
      {
        path: 'auditoria',
        loadComponent: () =>
          import('./features/auditoria/auditoria.component').then((m) => m.AuditoriaComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.AUDITOR])],
      },
      {
        path: 'activos',
        loadComponent: () =>
          import('./features/activos/activos.component').then((m) => m.ActivosComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL])],
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/reportes/reportes.component').then((m) => m.ReportesComponent),
        canActivate: [roleGuard([Role.SUPER_ADMIN, Role.GERENTE_SUCURSAL, Role.AUDITOR])],
      },
      {
        path: 'pedidos',
        loadChildren: () =>
          import('./features/pedidos/pedidos.routes').then((m) => m.PEDIDOS_ROUTES),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

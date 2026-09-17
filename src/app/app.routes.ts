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
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./features/productos/productos.component').then((m) => m.ProductosComponent),
      },
      {
        path: 'lotes',
        loadComponent: () =>
          import('./features/lotes/lotes.component').then((m) => m.LotesComponent),
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

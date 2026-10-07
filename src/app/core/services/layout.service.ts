import { Injectable, signal, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private readonly router = inject(Router);

  // Estado del Sidebar en Desktop (Colapsado ~72px vs Expandido ~260px)
  readonly isCollapsed = signal<boolean>(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('sidebar_collapsed') === 'true'
      : false
  );

  // Estado del Sidebar en Móviles / Tablets (Drawer Offcanvas visible u oculto)
  readonly isMobileOpen = signal<boolean>(false);

  // Estado del acordeón de 'ADMINISTRACIÓN'
  readonly isAdminExpanded = signal<boolean>(true);

  constructor() {
    // Al navegar a cualquier ruta, cerrar automáticamente el drawer móvil si está abierto
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.closeMobile();
      });
  }

  /**
   * Alterna entre el modo expandido (~260px) y colapsado (~72px) en Desktop.
   */
  toggleCollapse(): void {
    const next = !this.isCollapsed();
    this.isCollapsed.set(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sidebar_collapsed', String(next));
    }
  }

  /**
   * Abre o cierra el drawer offcanvas en dispositivos móviles.
   */
  toggleMobile(): void {
    this.isMobileOpen.update((open) => !open);
  }

  /**
   * Cierra el drawer offcanvas en móviles.
   */
  closeMobile(): void {
    this.isMobileOpen.set(false);
  }

  /**
   * Alterna la apertura/cierre del acordeón de Administración.
   */
  toggleAdmin(): void {
    this.isAdminExpanded.update((exp) => !exp);
  }
}

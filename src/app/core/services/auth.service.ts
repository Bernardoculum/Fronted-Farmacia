import { environment } from '../../../environments/environment';
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginCredentials, LoginResponse, User } from '../models/auth.models';
import { Role } from '../enums/role.enum';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly TOKEN_KEY = 'farmacia_jwt_token';
  private readonly USER_KEY = 'farmacia_current_user';

  // Signals de estado reactivo
  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly token = signal<string | null>(this.getStoredToken());

  // Signals computados de identidad y rol
  readonly isAuthenticated = computed(() => !!this.token());
  readonly userRole = computed(() => this.currentUser()?.rol ?? null);
  
  readonly isSuperAdmin = computed(() => this.userRole() === Role.SUPER_ADMIN || this.userRole() === 'SUPER_ADMIN');
  readonly isGerente = computed(() => this.userRole() === Role.GERENTE_SUCURSAL || this.userRole() === 'GERENTE_SUCURSAL');
  readonly isCajero = computed(() => this.userRole() === Role.CAJERO || this.userRole() === 'CAJERO');
  readonly isCallCenter = computed(() => this.userRole() === Role.CALL_CENTER || this.userRole() === 'CALL_CENTER');
  readonly isAuditor = computed(() => this.userRole() === Role.AUDITOR || this.userRole() === 'AUDITOR');

  // Permisos computados de negocio (RBAC)
  readonly canManageCatalog = computed(() => this.isSuperAdmin() || this.isGerente());
  readonly canDeleteCatalog = computed(() => this.isSuperAdmin());
  readonly canViewKardex = computed(() => this.isSuperAdmin() || this.isGerente() || this.isAuditor());
  readonly canManageLotes = computed(() => this.isSuperAdmin() || this.isGerente());
  readonly canViewLotes = computed(() => this.isSuperAdmin() || this.isGerente() || this.isAuditor());
  
  readonly canAccessPOS = computed(() => this.isSuperAdmin() || this.isGerente() || this.isCajero());
  readonly canAccessCallCenter = computed(() => this.isSuperAdmin() || this.isCallCenter());
  readonly canAccessWebOrders = computed(() => this.isSuperAdmin() || this.isGerente() || this.isCallCenter());
  readonly canAccessHistorial = computed(() => true);

  hasRole(roles: (Role | string) | (Role | string)[]): boolean {
    const current = this.userRole();
    if (!current) return false;
    if (current === Role.SUPER_ADMIN || current === 'SUPER_ADMIN') return true;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(current);
  }

  getDefaultRouteForRole(): string {
    const role = this.userRole();
    if (role === Role.CAJERO || role === 'CAJERO') {
      return '/pedidos/pos';
    }
    if (role === Role.CALL_CENTER || role === 'CALL_CENTER') {
      return '/pedidos/call-center';
    }
    return '/dashboard';
  }

  login(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        this.setSession(res.accessToken, res.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}

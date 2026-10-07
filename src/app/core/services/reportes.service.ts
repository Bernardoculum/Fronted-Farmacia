import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DashboardResponse,
  VentasSucursalesResponse,
  TopMedicamento,
  AlertasInventario,
} from '../models/reportes.models';

@Injectable({
  providedIn: 'root',
})
export class ReportesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reportes`;

  getDashboard(fechaInicio?: string, fechaFin?: string, sucursalId?: number): Observable<DashboardResponse> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    if (sucursalId) params = params.set('sucursalId', sucursalId.toString());

    return this.http.get<DashboardResponse>(`${this.apiUrl}/dashboard`, { params });
  }

  getVentasSucursales(fechaInicio?: string, fechaFin?: string, sucursalId?: number): Observable<VentasSucursalesResponse> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    if (sucursalId) params = params.set('sucursalId', sucursalId.toString());

    return this.http.get<VentasSucursalesResponse>(`${this.apiUrl}/ventas-sucursales`, { params });
  }

  getTopMedicamentos(limit = 10, sucursalId?: number): Observable<TopMedicamento[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (sucursalId) params = params.set('sucursalId', sucursalId.toString());

    return this.http.get<TopMedicamento[]>(`${this.apiUrl}/top-medicamentos`, { params });
  }

  getAlertasInventario(sucursalId?: number): Observable<AlertasInventario> {
    let params = new HttpParams();
    if (sucursalId) params = params.set('sucursalId', sucursalId.toString());

    return this.http.get<AlertasInventario>(`${this.apiUrl}/alertas-inventario`, { params });
  }
}

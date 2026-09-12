import { environment } from '../../../environments/environment';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  ProductoListItem,
  ProductoDetail,
  FilterProductoParams,
  PaginatedResponse,
  KardexResponse,
  MovimientoKardexDto,
  CreateProductoDto,
  UpdateProductoDto,
} from '../models/producto.models';

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/productos`;

  // Signals de estado reactivo global del catálogo
  readonly productos = signal<ProductoListItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly totalItems = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly currentFilters = signal<FilterProductoParams>({});
  readonly selectedProducto = signal<ProductoDetail | null>(null);
  readonly kardexData = signal<KardexResponse | null>(null);

  /**
   * Carga la lista paginada de productos con filtros y actualiza los Signals reactivos.
   */
  cargarProductos(filters: FilterProductoParams = {}): Observable<PaginatedResponse<ProductoListItem>> {
    this.loading.set(true);
    this.currentFilters.set(filters);

    let params = new HttpParams()
      .set('page', (filters.page || this.currentPage()).toString())
      .set('limit', (filters.limit || this.pageSize()).toString());

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters.categoriaId) {
      params = params.set('categoriaId', filters.categoriaId.toString());
    }
    if (filters.conReceta) {
      params = params.set('requiereReceta', filters.conReceta);
    }
    if (filters.estado) {
      params = params.set('estado', filters.estado);
    }

    return this.http.get<PaginatedResponse<ProductoListItem>>(this.apiUrl, { params }).pipe(
      tap({
        next: (res) => {
          this.productos.set(res.data || []);
          this.totalItems.set(res.total || 0);
          this.currentPage.set(res.page || 1);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      })
    );
  }

  /**
   * Consulta el detalle completo de un medicamento por ID con sus lotes y existencias.
   */
  getProductoById(id: number): Observable<ProductoDetail> {
    return this.http.get<ProductoDetail>(`${this.apiUrl}/${id}`).pipe(
      tap((prod) => this.selectedProducto.set(prod))
    );
  }

  /**
   * Registra un nuevo medicamento en el catálogo.
   */
  createProducto(dto: CreateProductoDto): Observable<ProductoDetail> {
    return this.http.post<ProductoDetail>(this.apiUrl, dto).pipe(
      tap(() => this.cargarProductos(this.currentFilters()).subscribe())
    );
  }

  /**
   * Modifica los datos o precio de un medicamento existente.
   */
  updateProducto(id: number, dto: UpdateProductoDto): Observable<ProductoDetail> {
    return this.http.patch<ProductoDetail>(`${this.apiUrl}/${id}`, dto).pipe(
      tap((res) => {
        // Actualización quirúrgica en el Signal: solo modifica la fila correspondiente
        this.productos.update((items) =>
          items.map((item) =>
            item.productoId === id
              ? {
                  ...item,
                  nombre: res.nombre ?? item.nombre,
                  codigoProducto: res.codigoProducto ?? item.codigoProducto,
                  precioVenta: res.precioVenta ?? item.precioVenta,
                  concentracion: res.concentracion ?? item.concentracion,
                  presentacion: res.presentacion ?? item.presentacion,
                  requiereReceta: res.requiereReceta ?? item.requiereReceta,
                  categoria: (res as any).categoria?.nombre ?? item.categoria,
                  laboratorio: (res as any).laboratorio?.nombre ?? item.laboratorio,
                }
              : item
          )
        );
      })
    );
  }

  // Método auxiliar para agregar nuevo producto al inicio sin parpadeo
  agregarProductoLocal(nuevo: ProductoDetail): void {
    const item: ProductoListItem = {
      productoId: nuevo.productoId,
      codigoProducto: nuevo.codigoProducto,
      nombre: nuevo.nombre,
      principioActivo: nuevo.principioActivo,
      presentacion: nuevo.presentacion,
      concentracion: nuevo.concentracion,
      precioVenta: nuevo.precioVenta,
      porcentajeIva: nuevo.porcentajeIva,
      requiereReceta: nuevo.requiereReceta,
      estado: nuevo.estado,
      categoria: (nuevo as any).categoria?.nombre || 'General',
      laboratorio: (nuevo as any).laboratorio?.nombre || 'General',
      unidadMedida: (nuevo as any).unidadMedida?.nombre || 'Unidad',
      stockTotal: 0,
      lotes: [],
    };
    this.productos.update((items) => [item, ...items]);
    this.totalItems.update((t) => t + 1);
  }

  /**
   * Desactiva un producto (baja lógica).
   */
  deleteProducto(id: number): Observable<{ mensaje: string; id: number }> {
    return this.http.delete<{ mensaje: string; id: number }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cargarProductos(this.currentFilters()).subscribe())
    );
  }

  /**
   * Consulta el Kardex histórico cronológico de un medicamento.
   */
  getKardexByProducto(productoId: number, sucursalId?: number): Observable<KardexResponse> {
    let params = new HttpParams();
    if (sucursalId) {
      params = params.set('sucursalId', sucursalId.toString());
    }
    return this.http.get<KardexResponse>(`${this.apiUrl}/${productoId}/kardex`, { params }).pipe(
      tap((res) => this.kardexData.set(res))
    );
  }

  /**
   * Registra un movimiento transaccional de inventario (ENTRADA, SALIDA o AJUSTE).
   */
  registrarMovimientoKardex(dto: MovimientoKardexDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/kardex/movimiento`, dto).pipe(
      tap(() => {
        // Refrescar el catálogo para reflejar los nuevos saldos atómicos
        this.cargarProductos(this.currentFilters()).subscribe();
      })
    );
  }
}

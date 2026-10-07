import { environment } from '../../../environments/environment';
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  MetodoPago,
  Cliente,
  CreateClienteDto,
  CreatePedidoDto,
  PedidoItem,
  FilterPedidoParams,
  EvaluarDespachoDto,
  EvaluacionDespachoResponse,
} from '../models/pedido.models';

@Injectable({
  providedIn: 'root',
})
export class PedidosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/pedidos`;

  // Signals reactivos
  readonly pedidos = signal<PedidoItem[]>([]);
  readonly loading = signal<boolean>(false);
  readonly metodosPago = signal<MetodoPago[]>([]);
  readonly clientesEncontrados = signal<Cliente[]>([]);
  readonly currentFilters = signal<FilterPedidoParams>({});

  // Evaluación Inteligente de Despacho en Call Center
  readonly evaluacionActual = signal<EvaluacionDespachoResponse | null>(null);
  readonly evaluandoDespacho = signal<boolean>(false);

  // KPIs computados
  readonly totalPedidos = computed(() => this.pedidos().length);
  readonly pedidosMostrador = computed(
    () => this.pedidos().filter((p) => p.origen === 'MOSTRADOR' || p.origen === 'SUCURSAL')
  );
  readonly pedidosCallCenter = computed(
    () => this.pedidos().filter((p) => p.origen === 'CALL_CENTER')
  );
  readonly pedidosWebPortal = computed(
    () => this.pedidos().filter((p) => p.origen === 'PORTAL' || p.origen === 'TELEFONO')
  );
  readonly entregasEnRuta = computed(
    () => this.pedidos().filter((p) => p.entrega?.estado === 'EN_CAMINO' || p.entrega?.estado === 'EN_RUTA')
  );
  readonly totalFacturado = computed(() =>
    this.pedidos().reduce((sum, p) => sum + (Number(p.total) || 0), 0)
  );

  /**
   * Cargar métodos de pago disponibles
   */
  cargarMetodosPago(): void {
    this.http
      .get<MetodoPago[]>(`${this.baseUrl}/aux/metodos-pago`)
      .subscribe({
        next: (res) => this.metodosPago.set(res),
        error: (err) => console.error('Error al cargar métodos de pago:', err),
      });
  }

  /**
   * Buscar clientes por teléfono o nombre
   */
  buscarClientes(query?: string): Observable<Cliente[]> {
    let params = new HttpParams();
    if (query) {
      params = params.set('query', query);
    }
    return this.http
      .get<Cliente[]>(`${this.baseUrl}/aux/clientes`, { params })
      .pipe(
        tap((res) => {
          this.clientesEncontrados.set(res);
        })
      );
  }

  /**
   * Crear nuevo cliente rápido desde Call Center
   */
  crearCliente(dto: CreateClienteDto): Observable<Cliente> {
    return this.http
      .post<Cliente>(`${this.baseUrl}/aux/clientes`, dto)
      .pipe(
        tap((nuevo) => {
          this.clientesEncontrados.update((prev) => [nuevo, ...prev]);
        })
      );
  }

  /**
   * Evaluación inteligente de despacho: calcula distancias, stock en farmacias y tiempo estimado
   */
  evaluarDespacho(dto: EvaluarDespachoDto): Observable<EvaluacionDespachoResponse> {
    this.evaluandoDespacho.set(true);
    return this.http
      .post<EvaluacionDespachoResponse>(`${this.baseUrl}/evaluar-despacho`, dto)
      .pipe(
        tap({
          next: (res) => {
            this.evaluacionActual.set(res);
            this.evaluandoDespacho.set(false);
          },
          error: (err) => {
            console.error('Error al evaluar despacho:', err);
            this.evaluandoDespacho.set(false);
          },
        })
      );
  }

  limpiarEvaluacion(): void {
    this.evaluacionActual.set(null);
  }

  /**
   * Crear pedido transaccional (Mostrador o Call Center) con FEFO y descuento de inventario
   */
  crearPedido(dto: CreatePedidoDto): Observable<any> {
    this.loading.set(true);
    return this.http.post<any>(this.baseUrl, dto).pipe(
      tap({
        next: () => {
          this.loading.set(false);
          this.listarPedidos(); // Refrescar listado
        },
        error: () => this.loading.set(false),
      })
    );
  }

  /**
   * Listar pedidos con filtros
   */
  listarPedidos(filtros: FilterPedidoParams = {}): void {
    this.loading.set(true);
    this.currentFilters.set(filtros);

    let params = new HttpParams();
    if (filtros.origen) params = params.set('origen', filtros.origen);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.sucursalId) params = params.set('sucursalId', filtros.sucursalId.toString());
    if (filtros.clienteId) params = params.set('clienteId', filtros.clienteId.toString());
    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);
    if (filtros.page) params = params.set('page', filtros.page.toString());
    if (filtros.limit) params = params.set('limit', filtros.limit.toString());

    this.http.get<any>(this.baseUrl, { params }).subscribe({
      next: (res) => {
        const raw = res?.data || (Array.isArray(res) ? res : []);
        const normalized = raw.map((p: any) => ({
          ...p,
          sucursal: typeof p.sucursal === 'string'
            ? { sucursalId: p.sucursalId || 1, nombre: p.sucursal }
            : (p.sucursal || { sucursalId: p.sucursalId || 1, nombre: 'Sucursal Central (Zona 10)' }),
        }));
        this.pedidos.set(normalized);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al listar pedidos:', err);
        this.loading.set(false);
      },
    });
  }

  /**
   * Obtener detalle completo de un pedido por ID
   */
  obtenerPedidoPorId(id: number): Observable<PedidoItem> {
    return this.http.get<PedidoItem>(`${this.baseUrl}/${id}`);
  }

  /**
   * Actualizar estado del pedido o entrega
   */
  actualizarEstado(id: number, estado: string, observacion?: string): Observable<any> {
    return this.http
      .patch(`${this.baseUrl}/${id}/estado`, { estado, observacion })
      .pipe(
        tap(() => {
          this.listarPedidos(this.currentFilters());
        })
      );
  }
}

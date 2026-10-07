import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductosService } from '../../../core/services/productos.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductoListItem, MovimientoKardexDto, LoteInfo } from '../../../core/models/producto.models';
import { CustomValidators } from '../../../shared/validators/custom-validators';
import { OnlyNumbersDirective } from '../../../shared/directives/only-numbers.directive';

function formatFechaInput(dateStr?: string | null): string {
  if (!dateStr) return '';
  if (dateStr.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.slice(0, 10);
  }
  try {
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
  } catch {
    return '';
  }
}

@Component({
  selector: 'app-movimiento-kardex-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    OnlyNumbersDirective,
  ],
  template: `
    <div class="p-4 sm:p-6 max-w-lg w-full">
      <!-- Encabezado con información del medicamento -->
      <div class="flex items-start justify-between border-b border-slate-200 pb-3.5 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs">
            <mat-icon class="text-2xl">sync_alt</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-black text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded-md">
              Kardex de Inventario
            </span>
            <h2 class="text-base sm:text-lg font-black text-slate-800 mt-0.5 leading-tight">
              Movimiento de Stock
            </h2>
            <p class="text-xs text-slate-500 truncate max-w-sm">
              {{ data.nombre }} <span class="text-slate-400 font-mono">({{ data.codigoProducto }})</span>
              @if (data.presentacion) {
                <span class="text-slate-400">• {{ data.presentacion }}</span>
              }
            </p>
          </div>
        </div>

        <button mat-icon-button (click)="dialogRef.close()" class="text-slate-400 hover:text-slate-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Alerta de Error del Servidor -->
      @if (errorMessage()) {
        <div class="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs shadow-xs">
          <mat-icon class="text-rose-500 shrink-0 text-lg">error_outline</mat-icon>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <!-- Formulario Reactivo de Movimiento -->
      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-3.5">
        
        <!-- Sucursal / Farmacia y Tipo de Movimiento -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
              Sucursal / Farmacia *
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select formControlName="sucursalId">
                @for (suc of sucursales; track suc.id) {
                  <mat-option [value]="suc.id">{{ suc.nombre }}</mat-option>
                }
              </mat-select>
              @if (form.get('sucursalId')?.hasError('required') && form.get('sucursalId')?.touched) {
                <mat-error>La sucursal es obligatoria</mat-error>
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
              Tipo de Movimiento *
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select formControlName="tipoMovimiento">
                <mat-option value="ENTRADA">📥 ENTRADA (Ingreso stock)</mat-option>
                <mat-option value="SALIDA">📤 SALIDA (Retiro stock)</mat-option>
                <mat-option value="AJUSTE">⚖️ AJUSTE (Calibración física)</mat-option>
              </mat-select>
              @if (form.get('tipoMovimiento')?.hasError('required') && form.get('tipoMovimiento')?.touched) {
                <mat-error>El tipo es obligatorio</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <!-- SELECCIÓN DE LOTE DESPLEGABLE -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
            Lote del Medicamento *
          </label>
          
          @if (tieneLotes()) {
            <mat-form-field appearance="outline" class="w-full">
              <mat-select formControlName="numeroLote" (selectionChange)="onLoteChange($event.value)">
                @for (lote of data.lotes; track lote.loteId) {
                  <mat-option [value]="lote.numeroLote">
                    <div class="flex items-center justify-between gap-3 py-0.5 text-xs">
                      <span class="font-bold text-slate-800">🏷️ {{ lote.numeroLote }}</span>
                      <span class="text-slate-500 text-2xs">
                        Vence: {{ lote.fechaVencimiento | date:'dd/MM/yyyy' }}
                      </span>
                    </div>
                  </mat-option>
                }
              </mat-select>
              @if (form.get('numeroLote')?.hasError('required') && form.get('numeroLote')?.touched) {
                <mat-error>Debes seleccionar un lote</mat-error>
              }
            </mat-form-field>

            <!-- Ficha informativa contextual del lote seleccionado -->
            @if (loteSeleccionado(); as lote) {
              <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span class="text-3xs uppercase font-bold text-slate-400 block">Lote</span>
                  <span class="font-bold text-slate-700 font-mono">{{ lote.numeroLote }}</span>
                </div>
                <div>
                  <span class="text-3xs uppercase font-bold text-slate-400 block">Vencimiento</span>
                  <span class="font-medium text-slate-700">{{ lote.fechaVencimiento | date:'dd/MM/yyyy' }}</span>
                </div>
                <div>
                  <span class="text-3xs uppercase font-bold text-slate-400 block">Stock en Sucursal</span>
                  <span class="font-black" [ngClass]="stockEnSucursal() > 0 ? 'text-emerald-700' : 'text-slate-400'">
                    {{ stockEnSucursal() }} u.
                  </span>
                </div>
              </div>
            }
          } @else {
            <!-- Sin lotes registrados -->
            <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs">
              <mat-icon class="text-amber-500 shrink-0 text-lg">info</mat-icon>
              <div>
                <p class="font-bold">Este medicamento aún no tiene lotes registrados.</p>
                <p class="text-2xs text-amber-700 mt-0.5">
                  Para ingresar nuevos lotes con su factura de compra y fecha de caducidad, utiliza el módulo de <strong>Lotes</strong>.
                </p>
              </div>
            </div>
          }
        </div>

        <!-- Cantidad y Observación -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-2xs font-bold text-slate-600 uppercase">
                Cantidad a Operar *
              </label>
              @if (tipoMovimientoSeleccionado() === 'SALIDA') {
                <span class="text-3xs font-bold" [ngClass]="stockEnSucursal() > 0 ? 'text-slate-500' : 'text-rose-500'">
                  Disp: {{ stockEnSucursal() }} u.
                </span>
              }
            </div>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput type="text" formControlName="cantidad" appOnlyNumbers placeholder="0" />
              @if (form.get('cantidad')?.hasError('required') && form.get('cantidad')?.touched) {
                <mat-error>La cantidad es obligatoria</mat-error>
              }
              @if ((form.get('cantidad')?.hasError('min') || form.get('cantidad')?.hasError('enteroInvalido')) && form.get('cantidad')?.touched) {
                <mat-error class="text-2xs">Debe ser un número entero mayor a 0</mat-error>
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
              Observación o Motivo
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput formControlName="observacion" placeholder="Ej. Merma, calibración física..." />
            </mat-form-field>
          </div>
        </div>

        <!-- Alerta de Stock Insuficiente si es SALIDA -->
        @if (stockInsuficiente()) {
          <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs shadow-xs">
            <mat-icon class="text-rose-500 shrink-0 text-base">warning</mat-icon>
            <span>
              <strong>Stock insuficiente:</strong> Deseas retirar {{ cantidadIngresada() }} unidades, pero la sucursal seleccionada solo dispone de {{ stockEnSucursal() }} unidades de este lote.
            </span>
          </div>
        }

        <!-- Botones de Acción -->
        <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button type="button" mat-button (click)="dialogRef.close()" class="!rounded-xl">
            Cancelar
          </button>
          
          <button
            type="submit"
            mat-flat-button
            color="primary"
            [disabled]="form.invalid || saving() || stockInsuficiente() || !tieneLotes()"
            class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5"
          >
            @if (saving()) {
              <mat-spinner diameter="18" class="text-white mr-2"></mat-spinner>
              <span>Procesando...</span>
            } @else {
              <span>Confirmar Movimiento</span>
            }
          </button>
        </div>

      </form>
    </div>
  `,
})
export class MovimientoKardexModalComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<MovimientoKardexModalComponent>);
  readonly data = inject<ProductoListItem>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly productosService = inject(ProductosService);
  private readonly notification = inject(NotificationService);

  readonly sucursales = [
    { id: 1, nombre: 'Sucursal Central (Atanasio Tzul Z.12)' },
    { id: 2, nombre: 'Stand Gasolinera Mixco Norte' },
    { id: 3, nombre: 'Sucursal Antigua Calzada' },
    { id: 4, nombre: 'Sucursal Xela Los Altos' },
  ];

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly sucursalSeleccionadaId = signal<number>(1);
  readonly tipoMovimientoSeleccionado = signal<'ENTRADA' | 'SALIDA' | 'AJUSTE'>('ENTRADA');
  readonly loteSeleccionado = signal<LoteInfo | null>(null);
  readonly cantidadIngresada = signal<number>(10);

  readonly tieneLotes = computed(() => {
    return !!(this.data.lotes && this.data.lotes.length > 0);
  });

  readonly stockEnSucursal = computed(() => {
    const lote = this.loteSeleccionado();
    const sucId = this.sucursalSeleccionadaId();
    if (!lote) return 0;
    const inv = lote.inventarios?.find((i) => i.sucursalId === sucId);
    return inv ? Number(inv.disponible) || 0 : 0;
  });

  readonly stockInsuficiente = computed(() => {
    if (this.tipoMovimientoSeleccionado() !== 'SALIDA') return false;
    return this.cantidadIngresada() > this.stockEnSucursal();
  });

  readonly form = this.fb.group({
    sucursalId: [1, [Validators.required]],
    tipoMovimiento: ['ENTRADA' as 'ENTRADA' | 'SALIDA' | 'AJUSTE', [Validators.required]],
    numeroLote: ['', [Validators.required]],
    cantidad: [10, [Validators.required, Validators.min(1)]],
    observacion: ['', [CustomValidators.textoConLetras()]],
  });

  ngOnInit(): void {
    if (this.tieneLotes()) {
      const primerLote = this.data.lotes[0];
      this.loteSeleccionado.set(primerLote);
      this.form.patchValue({
        numeroLote: primerLote.numeroLote,
      });
    }

    // Escuchar cambios de sucursal
    this.form.get('sucursalId')?.valueChanges.subscribe((val) => {
      if (val) {
        this.sucursalSeleccionadaId.set(Number(val));
      }
    });

    // Escuchar cambios de tipo de movimiento
    this.form.get('tipoMovimiento')?.valueChanges.subscribe((tipo) => {
      if (tipo) {
        this.tipoMovimientoSeleccionado.set(tipo);
      }
    });

    // Escuchar cambios de cantidad
    this.form.get('cantidad')?.valueChanges.subscribe((cant) => {
      this.cantidadIngresada.set(Number(cant) || 0);
    });
  }

  onLoteChange(loteNum: string): void {
    const lote = this.data.lotes?.find((l) => l.numeroLote === loteNum);
    this.loteSeleccionado.set(lote || null);
  }

  guardar(): void {
    if (this.form.invalid || this.saving() || this.stockInsuficiente()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const val = this.form.getRawValue();
    const lote = this.loteSeleccionado();

    const dto: MovimientoKardexDto = {
      productoId: this.data.productoId,
      sucursalId: Number(val.sucursalId),
      tipoMovimiento: val.tipoMovimiento!,
      numeroLote: val.numeroLote!.trim(),
      fechaVencimiento: lote?.fechaVencimiento ? formatFechaInput(lote.fechaVencimiento) : undefined as any,
      costoUnitario: lote?.costoUnitario != null ? Number(lote.costoUnitario) : undefined,
      cantidad: Number(val.cantidad),
      referenciaTipo: 'MANUAL',
      observacion: val.observacion?.trim() || undefined,
    };

    this.productosService.registrarMovimientoKardex(dto).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.notification.success(
          'Movimiento Registrado',
          `Ajuste de ${dto.tipoMovimiento} (${dto.cantidad} u.) asentado en Kardex.`
        );
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err.error?.message || 'Error al procesar el movimiento en el inventario.';
        this.errorMessage.set(msg);
        this.notification.error('Error en Ajuste', msg);
      },
    });
  }
}

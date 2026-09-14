import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LotesService } from '../../../core/services/lotes.service';
import { ProductosService } from '../../../core/services/productos.service';
import { CreateLoteDto } from '../../../core/models/lote.models';
import { ProductoListItem } from '../../../core/models/producto.models';

@Component({
  selector: 'app-lote-form-modal',
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
  ],
  template: `
    <div class="p-4 sm:p-6 max-w-xl w-full">
      <!-- Encabezado -->
      <div class="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
            <mat-icon class="text-2xl">qr_code_2</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
              Recepción de Mercancía
            </span>
            <h2 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">
              Registrar Nuevo Lote Físico
            </h2>
            <p class="text-xs text-slate-500">Asocia una tanda de fabricación a un medicamento existente</p>
          </div>
        </div>

        <button mat-icon-button (click)="dialogRef.close()" class="text-slate-400 hover:text-slate-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Alerta de Error -->
      @if (errorMessage()) {
        <div class="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs shadow-xs">
          <mat-icon class="text-rose-500 shrink-0 text-lg">error_outline</mat-icon>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <!-- Formulario -->
      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-3.5">
        
        <!-- Selección de Producto -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
            Medicamento del Catálogo *
          </label>
          <mat-form-field appearance="outline" class="w-full">
            <mat-select formControlName="productoId" placeholder="Selecciona el producto">
              @for (prod of listaProductos(); track prod.productoId) {
                <mat-option [value]="prod.productoId">
                  {{ prod.codigoProducto }} — {{ prod.nombre }} ({{ prod.presentacion || 'Unidad' }})
                </mat-option>
              }
            </mat-select>
            @if (form.get('productoId')?.hasError('required') && form.get('productoId')?.touched) {
              <mat-error>Debes seleccionar un medicamento</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Número de Lote y Costo Unitario -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
              Número de Lote (Impreso en caja) *
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput formControlName="numeroLote" placeholder="Ej. LOT-2026-X01" />
              @if (form.get('numeroLote')?.hasError('required') && form.get('numeroLote')?.touched) {
                <mat-error>El número de lote es obligatorio</mat-error>
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
              Costo de Compra al Proveedor (Q) *
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput type="number" min="0" step="0.01" formControlName="costoUnitario" placeholder="0.00" />
              @if (form.get('costoUnitario')?.hasError('required') && form.get('costoUnitario')?.touched) {
                <mat-error>El costo es obligatorio</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <!-- Fechas de Fabricación y Vencimiento -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
              Fecha de Fabricación
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput type="date" formControlName="fechaFabricacion" />
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">
              Fecha de Vencimiento / Caducidad *
            </label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput type="date" formControlName="fechaVencimiento" />
              @if (form.get('fechaVencimiento')?.hasError('required') && form.get('fechaVencimiento')?.touched) {
                <mat-error>La fecha de vencimiento es obligatoria</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <!-- Sección Opcional de Stock Inicial -->
        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <div class="flex items-center gap-2 mb-2">
            <mat-icon class="text-teal-600 text-sm">inventory</mat-icon>
            <span class="text-xs font-bold text-slate-700">Ingreso Inicial a Farmacia (Opcional)</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-2xs font-bold text-slate-500 uppercase mb-1">Sucursal Destino</label>
              <mat-form-field appearance="outline" class="w-full">
                <mat-select formControlName="sucursalId">
                  <mat-option [value]="1">Sucursal Zona 10 Centro</mat-option>
                  <mat-option [value]="2">Stand Gasolinera Mixco Norte</mat-option>
                  <mat-option [value]="3">Sucursal Antigua Calzada</mat-option>
                  <mat-option [value]="4">Sucursal Xela Los Altos</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div>
              <label class="block text-2xs font-bold text-slate-500 uppercase mb-1">Cajas a Ingresar</label>
              <mat-form-field appearance="outline" class="w-full">
                <input matInput type="number" min="0" formControlName="stockInicial" placeholder="0" />
              </mat-form-field>
            </div>
          </div>
          <span class="text-2xs text-slate-400 block mt-1">
            Si colocas unidades, se asentará automáticamente una entrada en el Kardex.
          </span>
        </div>

        <!-- Botones -->
        <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button type="button" mat-button (click)="dialogRef.close()" class="!rounded-xl">
            Cancelar
          </button>
          
          <button
            type="submit"
            mat-flat-button
            color="primary"
            [disabled]="form.invalid || saving()"
            class="!rounded-xl !bg-indigo-600 !text-white !font-bold !px-5"
          >
            @if (saving()) {
              <mat-spinner diameter="18" class="text-white mr-2"></mat-spinner>
              <span>Guardando lote...</span>
            } @else {
              <span>Registrar Lote</span>
            }
          </button>
        </div>

      </form>
    </div>
  `,
})
export class LoteFormModalComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<LoteFormModalComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly lotesService = inject(LotesService);
  private readonly productosService = inject(ProductosService);

  readonly listaProductos = signal<ProductoListItem[]>([]);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    productoId: [null as number | null, [Validators.required]],
    numeroLote: ['', [Validators.required]],
    fechaVencimiento: ['', [Validators.required]],
    fechaFabricacion: [''],
    costoUnitario: [10.0, [Validators.required, Validators.min(0)]],
    sucursalId: [1],
    stockInicial: [20, [Validators.min(0)]],
  });

  ngOnInit(): void {
    // Cargar productos para el selector
    this.productosService.cargarProductos({ limit: 50 }).subscribe({
      next: (res) => {
        this.listaProductos.set(res.data || []);
        if (res.data && res.data.length > 0) {
          this.form.patchValue({ productoId: res.data[0].productoId });
        }
      },
    });
  }

  guardar(): void {
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const val = this.form.getRawValue();
    const dto: CreateLoteDto = {
      productoId: Number(val.productoId),
      numeroLote: val.numeroLote!.trim(),
      fechaVencimiento: val.fechaVencimiento!,
      fechaFabricacion: val.fechaFabricacion || undefined,
      costoUnitario: Number(val.costoUnitario),
      sucursalId: Number(val.sucursalId) || undefined,
      stockInicial: Number(val.stockInicial) || undefined,
    };

    this.lotesService.createLote(dto).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(
          err.error?.message || 'Error al registrar el lote en la base de datos.'
        );
      },
    });
  }
}

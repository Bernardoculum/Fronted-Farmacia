import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductosService } from '../../../core/services/productos.service';
import { ProductoListItem, CreateProductoDto } from '../../../core/models/producto.models';

@Component({
  selector: 'app-producto-form-modal',
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
    MatRadioModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatTooltipModule,
  ],
  template: `
    <div class="p-4 sm:p-6 max-w-2xl w-full">
      <!-- Encabezado -->
      <div class="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-xs">
            <mat-icon class="text-2xl">{{ isEdit ? 'edit_note' : 'add_circle' }}</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded">
              Catálogo Maestro
            </span>
            <h2 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">
              {{ isEdit ? 'Modificar Medicamento' : 'Nuevo Medicamento' }}
            </h2>
            <p class="text-xs text-slate-500">
              {{ isEdit ? 'Actualiza los datos técnicos o comerciales' : 'Ingresa los datos o usa el código sugerido automáticamente' }}
            </p>
          </div>
        </div>

        <button mat-icon-button (click)="dialogRef.close()" class="text-slate-400 hover:text-slate-600">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Alerta de Error -->
      @if (errorMessage()) {
        <div class="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs shadow-xs animate-fade-in">
          <mat-icon class="text-rose-500 shrink-0 text-lg">error_outline</mat-icon>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      <!-- Formulario con Validaciones Reactivas -->
      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-3">
        
        <!-- Código y Nombre -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-2xs font-bold text-slate-600 uppercase">Código / SKU *</label>
              @if (!isEdit) {
                <span class="text-3xs font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.2 rounded">Sugerido</span>
              }
            </div>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput formControlName="codigoProducto" placeholder="MED-XXXX o código de barras" />
              @if (form.get('codigoProducto')?.hasError('required') && form.get('codigoProducto')?.touched) {
                <mat-error class="text-2xs">El código es obligatorio</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Nombre del Medicamento *</label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput formControlName="nombre" placeholder="Ej. Panadol, Amoxicilina, Aspirina..." />
              @if (form.get('nombre')?.hasError('required') && form.get('nombre')?.touched) {
                <mat-error class="text-2xs">El nombre comercial es obligatorio</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <!-- Gramaje y Presentación con Autocompletado y Sugerencias de 1 Clic -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-2xs font-bold text-slate-600 uppercase">Gramaje</label>
              <span class="text-3xs text-teal-600 font-medium">Sugerencias al escribir</span>
            </div>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                formControlName="concentracion"
                [matAutocomplete]="autoGramaje"
                placeholder="Ej. 500 mg, 1 g..."
              />
              <mat-icon matSuffix class="text-slate-400 text-base">arrow_drop_down</mat-icon>
              <mat-autocomplete #autoGramaje="matAutocomplete">
                @for (g of filteredGramajes(); track g) {
                  <mat-option [value]="g">
                    <span class="font-medium text-slate-700">{{ g }}</span>
                  </mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-2xs font-bold text-slate-600 uppercase">Presentación</label>
              <span class="text-3xs text-teal-600 font-medium">Sugerencias al escribir</span>
            </div>
            <mat-form-field appearance="outline" class="w-full">
              <input
                matInput
                formControlName="presentacion"
                [matAutocomplete]="autoPresentacion"
                placeholder="Ej. Caja x 20 tabletas..."
              />
              <mat-icon matSuffix class="text-slate-400 text-base">arrow_drop_down</mat-icon>
              <mat-autocomplete #autoPresentacion="matAutocomplete">
                @for (p of filteredPresentaciones(); track p) {
                  <mat-option [value]="p">
                    <span class="font-medium text-slate-700">{{ p }}</span>
                  </mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
          </div>
        </div>

        <!-- Categoría y Laboratorio -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Categoría Farmacéutica *</label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select formControlName="categoriaId">
                <mat-option [value]="1">Analgésicos y Antipiréticos</mat-option>
                <mat-option [value]="2">Antibióticos</mat-option>
                <mat-option [value]="3">Antiinflamatorios</mat-option>
                <mat-option [value]="4">Antihistamínicos</mat-option>
                <mat-option [value]="5">Vitaminas y Suplementos</mat-option>
              </mat-select>
              @if (form.get('categoriaId')?.hasError('required')) {
                <mat-error class="text-2xs">Selecciona una categoría</mat-error>
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Laboratorio Fabricante *</label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select formControlName="laboratorioId">
                <mat-option [value]="1">Laboratorios Vijosa</mat-option>
                <mat-option [value]="2">Bayer de Guatemala</mat-option>
                <mat-option [value]="3">Laboratorios Menarini</mat-option>
                <mat-option [value]="4">Donovan Werke</mat-option>
                <mat-option [value]="5">Pfizer Centroamérica</mat-option>
              </mat-select>
              @if (form.get('laboratorioId')?.hasError('required')) {
                <mat-error class="text-2xs">Selecciona un laboratorio</mat-error>
              }
            </mat-form-field>
          </div>
        </div>

        <!-- Unidad de Medida -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Unidad de Medida *</label>
            <mat-form-field appearance="outline" class="w-full">
              <mat-select formControlName="unidadMedidaId">
                <mat-option [value]="1">Caja (CJ)</mat-option>
                <mat-option [value]="2">Frasco (FCO)</mat-option>
                <mat-option [value]="3">Tubo (TUB)</mat-option>
                <mat-option [value]="4">Blíster (BLI)</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <!-- Precio y Receta Médica -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Precio de Venta (Q) *</label>
            <mat-form-field appearance="outline" class="w-full">
              <input matInput type="number" min="0.01" step="0.01" formControlName="precioVenta" placeholder="0.00" />
              @if (form.get('precioVenta')?.hasError('required') && form.get('precioVenta')?.touched) {
                <mat-error class="text-2xs">El precio es obligatorio</mat-error>
              }
              @if (form.get('precioVenta')?.hasError('min')) {
                <mat-error class="text-2xs">El precio debe ser mayor a Q 0.00</mat-error>
              }
            </mat-form-field>
          </div>

          <div>
            <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">¿Requiere Receta Médica? *</label>
            <mat-radio-group formControlName="requiereReceta" class="flex gap-4 mt-2">
              <mat-radio-button value="N">No (Venta Libre)</mat-radio-button>
              <mat-radio-button value="S">Sí (Receta Obligatoria)</mat-radio-button>
            </mat-radio-group>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button type="button" mat-button (click)="dialogRef.close()" class="!rounded-xl">
            Cancelar
          </button>
          
          <button
            type="submit"
            mat-flat-button
            color="primary"
            [disabled]="form.invalid || saving()"
            class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5"
          >
            @if (saving()) {
              <mat-spinner diameter="18" class="text-white mr-2"></mat-spinner>
              <span>Guardando...</span>
            } @else {
              <span>{{ isEdit ? 'Actualizar Producto' : 'Guardar Producto' }}</span>
            }
          </button>
        </div>

      </form>
    </div>
  `,
})
export class ProductoFormModalComponent {
  readonly dialogRef = inject(MatDialogRef<ProductoFormModalComponent>);
  readonly data = inject<ProductoListItem | null>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);
  private readonly productosService = inject(ProductosService);

  readonly isEdit = !!this.data?.productoId;
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Listas de sugerencias comunes
  readonly gramajesComunes: string[] = [
    '500 mg',
    '1 g (1000 mg)',
    '250 mg',
    '100 mg',
    '50 mg',
    '20 mg',
    '10 mg',
    '5 mg',
    '100 mg / 5 ml',
    '250 mg / 5 ml',
    'No aplica',
  ];

  readonly presentacionesComunes: string[] = [
    'Caja x 10 tabletas',
    'Caja x 20 tabletas',
    'Caja x 30 tabletas',
    'Caja x 100 tabletas',
    'Caja x 10 cápsulas',
    'Caja x 20 cápsulas',
    'Frasco 120 ml',
    'Frasco 60 ml',
    'Tubo 30 g (Crema/Gel)',
    'Ampolla inyectable',
    'Gotero 15 ml',
    'Blíster x 10 tabletas',
    'Bolsa x 1 unidad',
  ];

  filteredGramajes(): string[] {
    const val = (this.form.get('concentracion')?.value || '').toLowerCase().trim();
    if (!val) return this.gramajesComunes;
    return this.gramajesComunes.filter((g) => g.toLowerCase().includes(val));
  }

  filteredPresentaciones(): string[] {
    const val = (this.form.get('presentacion')?.value || '').toLowerCase().trim();
    if (!val) return this.presentacionesComunes;
    return this.presentacionesComunes.filter((p) => p.toLowerCase().includes(val));
  }

  // Genera un código automático correlativo basado en la cantidad de productos
  private generarCodigoSugerido(): string {
    const total = (this.productosService.totalItems() || 0) + 1;
    const pad = String(total).padStart(4, '0');
    return `MED-${pad}`;
  }

  readonly form = this.fb.group({
    codigoProducto: [
      this.data?.codigoProducto || this.generarCodigoSugerido(),
      [Validators.required, Validators.maxLength(50)],
    ],
    nombre: [this.data?.nombre || '', [Validators.required, Validators.maxLength(200)]],
    principioActivo: [this.data?.principioActivo || ''],
    presentacion: [this.data?.presentacion || ''],
    concentracion: [this.data?.concentracion || ''],
    categoriaId: [this.data?.categoriaId || 1, [Validators.required]],
    laboratorioId: [this.data?.laboratorioId || 1, [Validators.required]],
    unidadMedidaId: [1, [Validators.required]],
    precioVenta: [this.data?.precioVenta || 25.0, [Validators.required, Validators.min(0.01)]],
    requiereReceta: [this.data?.requiereReceta || 'N', [Validators.required]],
  });

  guardar(): void {
    if (this.form.invalid || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const val = this.form.getRawValue();
    const codigoFinal = val.codigoProducto?.trim() || this.generarCodigoSugerido();

    const dto: CreateProductoDto = {
      codigoProducto: codigoFinal,
      nombre: val.nombre!.trim(),
      principioActivo: val.principioActivo?.trim() || undefined,
      presentacion: val.presentacion?.trim() || undefined,
      concentracion: val.concentracion?.trim() || undefined,
      categoriaId: Number(val.categoriaId),
      laboratorioId: Number(val.laboratorioId),
      unidadMedidaId: Number(val.unidadMedidaId),
      precioVenta: Number(val.precioVenta),
      porcentajeIva: 12,
      requiereReceta: val.requiereReceta as 'S' | 'N',
      estado: 'ACTIVO',
    };

    const request$ = this.isEdit
      ? this.productosService.updateProducto(this.data!.productoId, dto)
      : this.productosService.createProducto(dto);

    request$.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.dialogRef.close(res);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(
          err.error?.message || 'Error al guardar los datos del medicamento.'
        );
      },
    });
  }
}

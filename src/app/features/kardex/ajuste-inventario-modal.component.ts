import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { KardexService } from '../../core/services/kardex.service';
import { LotesService } from '../../core/services/lotes.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LoteItem } from '../../core/models/lote.models';
import { CustomValidators } from '../../shared/validators/custom-validators';
import { OnlyNumbersDirective } from '../../shared/directives/only-numbers.directive';

@Component({
  selector: 'app-ajuste-inventario-modal',
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
    OnlyNumbersDirective,
  ],
  template: `
    <div class="p-4 sm:p-6 max-w-lg w-full bg-white text-slate-800 rounded-2xl">
      <!-- Cabecera Estandarizada -->
      <div class="flex items-start justify-between pb-4 border-b border-slate-200 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs shrink-0">
            <mat-icon class="text-2xl">tune</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded inline-block">
              Auditoría de Stock
            </span>
            <h3 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">Ajuste Manual de Inventario</h3>
            <p class="text-xs text-slate-500">Asiento auditado en Kardex por descuadre físico o avería</p>
          </div>
        </div>
        <button
          type="button"
          mat-icon-button
          (click)="cerrar()"
          class="text-slate-400 hover:text-slate-600"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Formulario -->
      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-3">
        <!-- Selector de Lote / Medicamento -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Medicamento y Lote a Ajustar *</label>
          <mat-form-field appearance="outline" class="w-full">
            <mat-select formControlName="inventarioId" placeholder="Selecciona un lote de inventario...">
              @for (l of lotesDisponibles(); track l.loteId) {
                @for (inv of inventariosDisponibles(l); track inv.inventarioId) {
                  <mat-option [value]="inv.inventarioId">
                    {{ l.producto.nombre }} (Lote: {{ l.numeroLote }}) - {{ inv.sucursal }} [Disp: {{ inv.disponible }}]
                  </mat-option>
                }
              }
            </mat-select>
            @if (form.get('inventarioId')?.hasError('required') && form.get('inventarioId')?.touched) {
              <mat-error class="text-2xs">Debe seleccionar un lote</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Tipo de Ajuste -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-2">Tipo de Ajuste *</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              (click)="setTipo('SALIDA')"
              [class.bg-rose-50]="form.get('tipoAjuste')?.value === 'SALIDA'"
              [class.border-rose-400]="form.get('tipoAjuste')?.value === 'SALIDA'"
              [class.text-rose-700]="form.get('tipoAjuste')?.value === 'SALIDA'"
              class="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <mat-icon class="!text-sm !w-4 !h-4">remove_circle</mat-icon>
              <span>Salida / Merma</span>
            </button>
            <button
              type="button"
              (click)="setTipo('ENTRADA')"
              [class.bg-emerald-50]="form.get('tipoAjuste')?.value === 'ENTRADA'"
              [class.border-emerald-400]="form.get('tipoAjuste')?.value === 'ENTRADA'"
              [class.text-emerald-700]="form.get('tipoAjuste')?.value === 'ENTRADA'"
              class="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <mat-icon class="!text-sm !w-4 !h-4">add_circle</mat-icon>
              <span>Entrada / Sobrante</span>
            </button>
          </div>
        </div>

        <!-- Cantidad -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Cantidad de Cajas / Unidades *</label>
          <mat-form-field appearance="outline" class="w-full">
            <input
              matInput
              type="text"
              formControlName="cantidad"
              appOnlyNumbers
              placeholder="Ej. 3"
            />
            @if (form.get('cantidad')?.hasError('required') && form.get('cantidad')?.touched) {
              <mat-error class="text-2xs">La cantidad es obligatoria</mat-error>
            }
            @if ((form.get('cantidad')?.hasError('min') || form.get('cantidad')?.hasError('enteroInvalido')) && form.get('cantidad')?.touched) {
              <mat-error class="text-2xs">Debe ser un número entero mayor a 0</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Justificación Obligatoria -->
        <div>
          <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Justificación de Auditoría *</label>
          <mat-form-field appearance="outline" class="w-full">
            <textarea
              matInput
              rows="2"
              formControlName="justificacion"
              placeholder="Ej. Daño físico durante estiba, diferencia en conteo ciego mensual..."
            ></textarea>
            @if (form.get('justificacion')?.hasError('required') && form.get('justificacion')?.touched) {
              <mat-error class="text-2xs">La justificación es obligatoria</mat-error>
            }
            @if ((form.get('justificacion')?.hasError('soloNumeros') || form.get('justificacion')?.hasError('requiereLetras')) && form.get('justificacion')?.touched) {
              <mat-error class="text-2xs">No se permite solo números (ej. '323'). Ingrese texto descriptivo.</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Acciones -->
        <div class="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            mat-button
            (click)="cerrar()"
            class="!rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            mat-flat-button
            color="primary"
            [disabled]="form.invalid || guardando()"
            class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5"
          >
            <span>{{ guardando() ? 'Guardando...' : 'Aplicar Ajuste' }}</span>
          </button>
        </div>
      </form>
    </div>
  `
})
export class AjusteInventarioModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AjusteInventarioModalComponent>);
  private readonly kardexService = inject(KardexService);
  private readonly lotesService = inject(LotesService);
  private readonly notification = inject(NotificationService);
  readonly authService = inject(AuthService);

  readonly guardando = signal<boolean>(false);
  readonly lotesDisponibles = signal<LoteItem[]>([]);

  inventariosDisponibles(lote: LoteItem) {
    if (this.authService.hasGlobalBranchAccess()) {
      return lote.inventarios || [];
    }
    const userSucId = this.authService.userSucursalId();
    return (lote.inventarios || []).filter((i) => i.sucursalId === userSucId);
  }

  readonly form: FormGroup = this.fb.group({
    inventarioId: [null, [Validators.required]],
    tipoAjuste: ['SALIDA', [Validators.required]],
    cantidad: [null, [Validators.required, CustomValidators.enteroPositivo()]],
    justificacion: ['', [Validators.required, Validators.minLength(5), CustomValidators.textoConLetras()]],
  });

  ngOnInit(): void {
    this.lotesService.cargarLotes().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        this.lotesDisponibles.set(list);
      },
    });
  }

  setTipo(tipo: 'ENTRADA' | 'SALIDA'): void {
    this.form.patchValue({ tipoAjuste: tipo });
  }

  guardar(): void {
    if (this.form.invalid || this.guardando()) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardando.set(true);

    const val = this.form.value;
    this.kardexService
      .registrarAjuste({
        inventarioId: Number(val.inventarioId),
        tipoAjuste: val.tipoAjuste,
        cantidad: Number(val.cantidad),
        motivo: val.justificacion.trim(),
      })
      .subscribe({
        next: () => {
          this.notification.success('Ajuste Registrado', 'El movimiento de inventario fue asentado en Kardex con éxito.');
          this.guardando.set(false);
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          this.notification.error('Error al registrar ajuste', err?.error?.message || 'Fallo en la transacción');
          this.guardando.set(false);
        },
      });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

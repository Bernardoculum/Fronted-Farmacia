import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { PlanillasService } from '../../../core/services/planillas.service';
import { SucursalesService } from '../../../core/services/sucursales.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CustomValidators } from '../../../shared/validators/custom-validators';
import { OnlyNumbersDirective } from '../../../shared/directives/only-numbers.directive';
import { OnlyLettersDirective } from '../../../shared/directives/only-letters.directive';
import { EmpleadoItem, PuestoItem } from '../../../core/models/planillas.models';
import { SucursalOption } from '../../../core/models/sucursal.models';

@Component({
  selector: 'app-colaborador-form-modal',
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
    OnlyLettersDirective,
  ],
  styles: [`
    :host {
      display: block;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      width: 100%;
    }
    ::ng-deep .colab-field .mat-mdc-form-field-subscript-wrapper {
      padding-top: 1px !important;
      font-size: 0.70rem !important;
    }
  `],
  template: `
    <div class="p-5 sm:p-6 w-full bg-white text-slate-800 max-h-[90vh] overflow-y-auto">
      
      <!-- Encabezado Estandarizado -->
      <div class="flex items-start justify-between border-b border-slate-200 pb-3 mb-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-xs shrink-0">
            <mat-icon class="text-2xl">{{ empleadoActual ? 'badge' : 'person_add' }}</mat-icon>
          </div>
          <div>
            <span class="text-2xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded inline-block">
              Gestión de Talento Humano
            </span>
            <h2 class="text-base sm:text-lg font-black text-slate-800 mt-0.5">
              {{ empleadoActual ? 'Expediente del Colaborador' : 'Nuevo Colaborador de Nómina' }}
            </h2>
            <p class="text-xs text-slate-500">
              Datos personales, contrato, seguridad social y condiciones de pago
            </p>
          </div>
        </div>

        <button
          type="button"
          mat-icon-button
          (click)="dialogRef.close()"
          class="text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Formulario Organizado por Secciones Temáticas -->
      <form [formGroup]="form" (ngSubmit)="guardar()" class="space-y-4">
        
        <!-- SECCIÓN 1: INFORMACIÓN PERSONAL Y CONTACTO -->
        <div class="space-y-3 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-1.5 pb-1 border-b border-slate-100">
            <mat-icon class="!w-4 !h-4 !text-xs text-slate-400">person</mat-icon>
            <h3 class="text-xs uppercase tracking-wider font-bold text-slate-500">
              Información Personal y Contacto
            </h3>
          </div>

          <!-- Fila 1: Nombres, Apellidos, DPI (3 columnas) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <!-- Nombres -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Nombres *</label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                <input matInput type="text" formControlName="nombre" appOnlyLetters placeholder="Ej. Carlos Alberto" />
                <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">person</mat-icon>
                @if (form.get('nombre')?.hasError('required') && form.get('nombre')?.touched) {
                  <mat-error class="text-2xs font-medium">Nombres obligatorios</mat-error>
                }
                @if (form.get('nombre')?.hasError('soloLetras') && form.get('nombre')?.touched) {
                  <mat-error class="text-2xs font-medium">Solo letras válidas</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Apellidos -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Apellidos *</label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                <input matInput type="text" formControlName="apellido" appOnlyLetters placeholder="Ej. Gómez Morales" />
                <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">person_outline</mat-icon>
                @if (form.get('apellido')?.hasError('required') && form.get('apellido')?.touched) {
                  <mat-error class="text-2xs font-medium">Apellidos obligatorios</mat-error>
                }
                @if (form.get('apellido')?.hasError('soloLetras') && form.get('apellido')?.touched) {
                  <mat-error class="text-2xs font-medium">Solo letras válidas</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- DPI / CUI -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">DPI / CUI *</label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                <input matInput type="text" formControlName="dpi" appOnlyNumbers maxDigits="13" maxlength="13" placeholder="Ej. 2541 89632 0101" />
                <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">badge</mat-icon>
                @if (form.get('dpi')?.hasError('required') && form.get('dpi')?.touched) {
                  <mat-error class="text-2xs font-medium">DPI obligatorio</mat-error>
                }
                @if (form.get('dpi')?.hasError('dpiInvalido') && form.get('dpi')?.touched) {
                  <mat-error class="text-2xs font-semibold text-rose-600">Debe tener 13 dígitos</mat-error>
                }
              </mat-form-field>
            </div>
          </div>

          <!-- Fila 2: NIT, Teléfono, Correo (3 columnas) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <!-- NIT -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">NIT</label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                <input matInput type="text" formControlName="nit" placeholder="Ej. 1234567-8 o CF" />
                <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">receipt</mat-icon>
                @if (form.get('nit')?.hasError('pattern') && form.get('nit')?.touched) {
                  <mat-error class="text-2xs font-semibold text-rose-600">NIT inválido</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Teléfono -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Teléfono</label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                <input matInput type="text" formControlName="telefono" appOnlyNumbers maxDigits="8" maxlength="8" placeholder="Ej. 55551234" />
                <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">phone</mat-icon>
                @if (form.get('telefono')?.hasError('telefonoInvalido') && form.get('telefono')?.touched) {
                  <mat-error class="text-2xs font-semibold text-rose-600">Debe tener 8 dígitos</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Correo Electrónico -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Correo Electrónico</label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                <input matInput type="email" formControlName="email" placeholder="colaborador@redfarma.com" />
                <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">email</mat-icon>
                @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                  <mat-error class="text-2xs font-semibold text-rose-600">Correo no válido</mat-error>
                }
              </mat-form-field>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 2: ASIGNACIÓN LABORAL Y CARGO -->
        <div class="space-y-3 pb-3 border-b border-slate-100">
          <div class="flex items-center gap-1.5 pb-1 border-b border-slate-100">
            <mat-icon class="!w-4 !h-4 !text-xs text-slate-400">work_outline</mat-icon>
            <h3 class="text-xs uppercase tracking-wider font-bold text-slate-500">
              Asignación Laboral y Cargo
            </h3>
          </div>

          <!-- Fila única: Puesto, Sucursal, Fecha de Ingreso (3 columnas) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <!-- Puesto Asignado -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Puesto Asignado *</label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                <mat-select formControlName="puestoId" placeholder="Seleccionar puesto...">
                  @for (p of puestos(); track p.puestoId) {
                    <mat-option [value]="p.puestoId">{{ p.nombre }}</mat-option>
                  }
                </mat-select>
                @if (form.get('puestoId')?.hasError('required') && form.get('puestoId')?.touched) {
                  <mat-error class="text-2xs font-medium">Seleccione un puesto</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Sucursal Asignada -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Sucursal Asignada *</label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                <mat-select formControlName="sucursalId" placeholder="Seleccionar sucursal...">
                  @for (s of sucursales(); track s.sucursalId) {
                    <mat-option [value]="s.sucursalId">{{ s.nombre }}</mat-option>
                  }
                </mat-select>
                @if (form.get('sucursalId')?.hasError('required') && form.get('sucursalId')?.touched) {
                  <mat-error class="text-2xs font-medium">Seleccione una sucursal</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Fecha de Ingreso -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Fecha de Ingreso *</label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                <input matInput type="date" formControlName="fechaIngreso" />
                @if (form.get('fechaIngreso')?.hasError('required') && form.get('fechaIngreso')?.touched) {
                  <mat-error class="text-2xs font-medium">Fecha obligatoria</mat-error>
                }
              </mat-form-field>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 3: CONDICIONES SALARIALES Y FORMA DE PAGO -->
        <div class="space-y-3">
          <div class="flex items-center gap-1.5 pb-1 border-b border-slate-100">
            <mat-icon class="!w-4 !h-4 !text-xs text-slate-400">payments</mat-icon>
            <h3 class="text-xs uppercase tracking-wider font-bold text-slate-500">
              Condiciones Salariales y Forma de Pago
            </h3>
          </div>

          <!-- Fila 1: Salario Base, No. Afiliación IGSS, Forma de Pago (3 columnas) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <!-- Salario Base Mensual -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Salario Base Mensual (Q) *</label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                <span matPrefix class="text-slate-400 font-bold mr-1">Q</span>
                <input
                  matInput
                  type="text"
                  formControlName="salarioActual"
                  appOnlyNumbers
                  [allowDecimals]="true"
                  placeholder="3500.00"
                />
                @if (form.get('salarioActual')?.hasError('required') && form.get('salarioActual')?.touched) {
                  <mat-error class="text-2xs font-medium">Salario obligatorio</mat-error>
                }
                @if ((form.get('salarioActual')?.hasError('min') || form.get('salarioActual')?.hasError('montoInvalido')) && form.get('salarioActual')?.touched) {
                  <mat-error class="text-2xs font-medium">Monto mayor a 0</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- No. Afiliación IGSS -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">No. Afiliación IGSS *</label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                <input matInput type="text" formControlName="noAfiliacionIgss" appOnlyNumbers placeholder="Ej. 1098765432" />
                <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">health_and_safety</mat-icon>
                @if (form.get('noAfiliacionIgss')?.hasError('required') && form.get('noAfiliacionIgss')?.touched) {
                  <mat-error class="text-2xs font-medium">No. de IGSS obligatorio</mat-error>
                }
                @if (form.get('noAfiliacionIgss')?.hasError('pattern') && form.get('noAfiliacionIgss')?.touched) {
                  <mat-error class="text-2xs font-semibold text-rose-600">Solo números válidos</mat-error>
                }
              </mat-form-field>
            </div>

            <!-- Forma de Pago -->
            <div>
              <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Forma de Pago *</label>
              <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                <mat-select formControlName="formaPago">
                  <mat-option value="TRANSFERENCIA">Transferencia Bancaria</mat-option>
                  <mat-option value="CHEQUE">Cheque</mat-option>
                  <mat-option value="EFECTIVO">Efectivo</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <!-- Fila 2: Banco y No. Cuenta (Grid 2 columnas - Condicional transferencia) -->
          @if (form.get('formaPago')?.value === 'TRANSFERENCIA') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <!-- Banco -->
              <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">Banco</label>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                  <mat-select formControlName="banco" placeholder="Seleccionar banco...">
                    <mat-option value="Banco Industrial">Banco Industrial</mat-option>
                    <mat-option value="Banrural">Banrural</mat-option>
                    <mat-option value="G&T Continental">G&T Continental</mat-option>
                    <mat-option value="BAC Credomatic">BAC Credomatic</mat-option>
                    <mat-option value="BAM">BAM</mat-option>
                    <mat-option value="Interbanco">Interbanco</mat-option>
                    <mat-option value="Otro">Otro</mat-option>
                  </mat-select>
                  <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">account_balance</mat-icon>
                </mat-form-field>
              </div>

              <!-- No. de Cuenta -->
              <div>
                <label class="block text-2xs font-bold text-slate-600 uppercase mb-1">No. de Cuenta</label>
                <mat-form-field appearance="outline" subscriptSizing="dynamic" class="w-full colab-field">
                  <input
                    matInput
                    type="text"
                    appOnlyNumbers
                    maxDigits="14"
                    maxlength="14"
                    formControlName="numeroCuenta"
                    placeholder="Ej. 0281234567 (8 a 14 dígitos)"
                  />
                  @if (form.get('numeroCuenta')?.hasError('cuentaInvalida') && form.get('numeroCuenta')?.touched) {
                    <mat-error class="text-2xs font-semibold text-rose-600">Debe tener entre 8 y 14 dígitos numéricos</mat-error>
                  }
                  <mat-icon matPrefix class="text-slate-400 !text-sm mr-1">credit_card</mat-icon>
                </mat-form-field>
              </div>
            </div>
          }
        </div>

        <!-- 2. TARJETA REDISEÑADA: PROYECCIÓN MENSUAL ESTIMADA (FULL-WIDTH CALLOUT) -->
        <div class="rounded-xl border border-emerald-200/90 bg-emerald-50/70 p-3.5 shadow-2xs">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-2 mb-2.5">
            <div class="flex items-center gap-2">
              <span class="text-sm">📊</span>
              <h4 class="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                Proyección Mensual Estimada
              </h4>
            </div>
            <span class="text-2xs font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
              IGSS Laboral: 4.83% (Decreto 37-2001)
            </span>
          </div>

          <!-- 4 Columnas bien alineadas y legibles -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
            <!-- 1. Salario Base -->
            <div class="bg-white/90 rounded-lg p-2.5 border border-emerald-100 shadow-2xs">
              <span class="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Salario Base (Q)
              </span>
              <span class="text-sm font-extrabold text-slate-800">
                Q {{ salarioInput() | number:'1.2-2' }}
              </span>
            </div>

            <!-- 2. Bonificación de Ley -->
            <div class="bg-white/90 rounded-lg p-2.5 border border-emerald-100 shadow-2xs">
              <span class="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Bonificación de Ley
              </span>
              <span class="text-sm font-extrabold text-emerald-700">
                + Q 250.00
              </span>
            </div>

            <!-- 3. Descuento IGSS (4.83%) -->
            <div class="bg-white/90 rounded-lg p-2.5 border border-emerald-100 shadow-2xs">
              <span class="block text-3xs font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                Descuento IGSS (4.83%)
              </span>
              <span class="text-sm font-extrabold text-rose-600">
                - Q {{ igssEstimado() | number:'1.2-2' }}
              </span>
            </div>

            <!-- 4. Líquido Estimado a Percibir -->
            <div class="bg-emerald-100/80 rounded-lg p-2.5 border border-emerald-300 shadow-2xs">
              <span class="block text-3xs font-black uppercase tracking-wider text-emerald-900 mb-0.5">
                Líquido Estimado
              </span>
              <span class="text-sm sm:text-base font-black text-slate-950">
                Q {{ liquidoEstimado() | number:'1.2-2' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="mt-4 pt-3.5 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            mat-button
            (click)="dialogRef.close()"
            class="!rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            mat-flat-button
            color="primary"
            [disabled]="guardando()"
            class="!rounded-xl !bg-teal-600 !text-white !font-bold !px-5 cursor-pointer shadow-xs"
          >
            <mat-icon class="!w-4 !h-4 !text-sm mr-1">save</mat-icon>
            <span>{{ guardando() ? 'Guardando...' : (empleadoActual ? 'Actualizar Colaborador' : 'Guardar Colaborador') }}</span>
          </button>
        </div>

      </form>
    </div>
  `
})
export class ColaboradorFormModalComponent implements OnInit {
  dialogRef = inject(MatDialogRef<ColaboradorFormModalComponent>);
  data = inject(MAT_DIALOG_DATA, { optional: true });
  private fb = inject(FormBuilder);
  private planillasService = inject(PlanillasService);
  private sucursalesService = inject(SucursalesService);
  private notification = inject(NotificationService);

  readonly guardando = signal<boolean>(false);
  readonly puestos = signal<PuestoItem[]>([]);
  readonly sucursales = signal<SucursalOption[]>([]);
  empleadoActual: EmpleadoItem | null = null;

  readonly form: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, CustomValidators.nombrePersona()]],
    apellido: ['', [Validators.required, CustomValidators.nombrePersona()]],
    dpi: ['', [Validators.required, CustomValidators.dpiGuatemala()]],
    telefono: ['', [CustomValidators.telefonoGuatemala()]],
    fechaIngreso: [new Date().toISOString().substring(0, 10), [Validators.required]],
    nit: ['', [Validators.pattern(/^[0-9]+(-?[0-9kK])?$/)]],
    noAfiliacionIgss: ['', [Validators.required, Validators.pattern(/^[0-9]{4,15}$/)]],
    formaPago: ['TRANSFERENCIA', [Validators.required]],
    banco: [''],
    numeroCuenta: ['', [CustomValidators.cuentaBancaria()]],
    email: ['', [Validators.email]],
    puestoId: [null, [Validators.required]],
    sucursalId: [null, [Validators.required]],
    salarioActual: [3500, [Validators.required, CustomValidators.montoPositivo()]],
  });

  // Proyección reactiva
  readonly salarioInput = signal<number>(3500);
  readonly igssEstimado = computed(() => {
    const s = Number(this.salarioInput()) || 0;
    return Number((s * 0.0483).toFixed(2));
  });
  readonly liquidoEstimado = computed(() => {
    const s = Number(this.salarioInput()) || 0;
    const igss = this.igssEstimado();
    return Number((s + 250.0 - igss).toFixed(2));
  });

  ngOnInit(): void {
    this.cargarCatalogos();

    this.form.get('salarioActual')?.valueChanges.subscribe((v) => {
      this.salarioInput.set(Number(v) || 0);
    });

    if (this.data?.empleado) {
      const emp: EmpleadoItem = this.data.empleado;
      this.empleadoActual = emp;
      this.salarioInput.set(Number(emp.salarioActual) || 3500);
      this.form.patchValue({
        nombre: emp.nombre,
        apellido: emp.apellido,
        dpi: emp.dpi,
        telefono: emp.telefono || '',
        fechaIngreso: emp.fechaIngreso
          ? new Date(emp.fechaIngreso).toISOString().substring(0, 10)
          : new Date().toISOString().substring(0, 10),
        nit: emp.nit || '',
        noAfiliacionIgss: emp.noAfiliacionIgss || '',
        formaPago: emp.formaPago || 'TRANSFERENCIA',
        banco: emp.banco || '',
        numeroCuenta: emp.numeroCuenta || '',
        email: emp.email || '',
        puestoId: emp.puestoId,
        sucursalId: emp.sucursalId,
        salarioActual: emp.salarioActual,
      });
    }
  }

  private cargarCatalogos(): void {
    forkJoin({
      puestos: this.planillasService.cargarPuestos(),
      sucursales: this.sucursalesService.cargarSucursales(),
    }).subscribe({
      next: ({ puestos, sucursales }) => {
        this.puestos.set(puestos || []);
        const listaSuc = Array.isArray(sucursales) ? sucursales : (sucursales?.data || []);
        this.sucursales.set(listaSuc);
      },
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const val = this.form.value;

    const payload = {
      nombre: val.nombre.trim(),
      apellido: val.apellido.trim(),
      dpi: val.dpi.trim(),
      telefono: val.telefono?.trim() || undefined,
      fechaIngreso: val.fechaIngreso,
      nit: val.nit?.trim() || undefined,
      noAfiliacionIgss: val.noAfiliacionIgss?.trim() || undefined,
      formaPago: val.formaPago,
      banco: val.formaPago === 'TRANSFERENCIA' ? (val.banco?.trim() || undefined) : undefined,
      numeroCuenta: val.formaPago === 'TRANSFERENCIA' ? (val.numeroCuenta?.trim() || undefined) : undefined,
      email: val.email?.trim() || undefined,
      puestoId: Number(val.puestoId),
      sucursalId: Number(val.sucursalId),
      salarioActual: Number(val.salarioActual),
    };

    const idActual = this.empleadoActual ? this.empleadoActual.empleadoId : null;
    const req$ = idActual
      ? this.planillasService.actualizarEmpleado(idActual, payload)
      : this.planillasService.crearEmpleado(payload);

    req$.subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.dialogRef.close(res);
        this.notification.success(
          this.empleadoActual ? 'Colaborador Actualizado' : 'Colaborador Registrado',
          `Expediente de "${val.nombre} ${val.apellido}" guardado correctamente.`
        );
      },
      error: (err) => {
        this.guardando.set(false);
        this.notification.error('Error al guardar', err?.error?.message || 'Fallo en el registro del colaborador.');
      },
    });
  }
}

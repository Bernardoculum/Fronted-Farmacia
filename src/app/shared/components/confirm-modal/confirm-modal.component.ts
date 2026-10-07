import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmModalData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  requiresInput?: boolean;
  inputPlaceholder?: string;
}

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="bg-white rounded-2xl overflow-hidden p-5 sm:p-6 max-w-md w-full">
      <div class="flex items-start gap-3.5 mb-4">
        <div [ngClass]="getIconBgClass()" class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
          <mat-icon [ngClass]="getIconTextClass()" class="text-xl">{{ getIcon() }}</mat-icon>
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-800 leading-tight">{{ data.title }}</h3>
          <p class="text-xs text-slate-500 mt-1 leading-relaxed">{{ data.message }}</p>
        </div>
      </div>

      @if (data.requiresInput) {
        <div class="mb-4">
          <input
            type="text"
            [(ngModel)]="inputValue"
            [placeholder]="data.inputPlaceholder || 'Ingresa el motivo...'"
            class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
        </div>
      }

      <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
        <button
          type="button"
          mat-button
          (click)="dialogRef.close(false)"
          class="!rounded-xl text-slate-600 font-semibold text-xs"
        >
          {{ data.cancelText || 'Cancelar' }}
        </button>

        <button
          type="button"
          mat-flat-button
          [ngClass]="getButtonClass()"
          [disabled]="data.requiresInput && !inputValue.trim()"
          (click)="confirmar()"
          class="!rounded-xl !font-bold text-xs !px-4 !h-9 shadow-xs cursor-pointer"
        >
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmModalComponent {
  inputValue = '';

  constructor(
    public dialogRef: MatDialogRef<ConfirmModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmModalData
  ) {}

  confirmar(): void {
    if (this.data.requiresInput) {
      this.dialogRef.close(this.inputValue.trim());
    } else {
      this.dialogRef.close(true);
    }
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'danger': return 'dangerous';
      case 'warning': return 'warning_amber';
      case 'success': return 'check_circle';
      default: return 'help_outline';
    }
  }

  getIconBgClass(): string {
    switch (this.data.type) {
      case 'danger': return 'bg-rose-50';
      case 'warning': return 'bg-amber-50';
      case 'success': return 'bg-emerald-50';
      default: return 'bg-sky-50';
    }
  }

  getIconTextClass(): string {
    switch (this.data.type) {
      case 'danger': return 'text-rose-600';
      case 'warning': return 'text-amber-600';
      case 'success': return 'text-emerald-600';
      default: return 'text-sky-600';
    }
  }

  getButtonClass(): string {
    switch (this.data.type) {
      case 'danger': return '!bg-rose-600 hover:!bg-rose-700 !text-white';
      case 'warning': return '!bg-amber-600 hover:!bg-amber-700 !text-white';
      case 'success': return '!bg-emerald-600 hover:!bg-emerald-700 !text-white';
      default: return '!bg-slate-800 hover:!bg-slate-900 !text-white';
    }
  }
}

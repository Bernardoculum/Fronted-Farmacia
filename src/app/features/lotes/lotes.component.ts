import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LotesService } from '../../core/services/lotes.service';
import { AuthService } from '../../core/services/auth.service';
import { LoteItem } from '../../core/models/lote.models';
import { LoteFormModalComponent } from './modals/lote-form-modal.component';

@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './lotes.component.html',
  styleUrl: './lotes.component.scss',
})
export class LotesComponent implements OnInit {
  readonly lotesService = inject(LotesService);
  readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  // Signals del servicio
  readonly lotes = this.lotesService.lotes;
  readonly loading = this.lotesService.loading;
  readonly totalLotes = this.lotesService.totalLotes;
  readonly countVigentes = this.lotesService.countVigentes;
  readonly countPorVencer = this.lotesService.countPorVencer;
  readonly countVencidos = this.lotesService.countVencidos;
  readonly user = this.authService.currentUser;

  // Filtros locales
  readonly searchTerm = signal('');
  readonly estadoFilter = signal<'TODOS' | 'VIGENTE' | 'POR_VENCER' | 'VENCIDO'>('TODOS');

  readonly canManageLotes = computed(() => {
    const rol = this.user()?.rol;
    return rol === 'SUPER_ADMIN' || rol === 'GERENTE_SUCURSAL';
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.lotesService.cargarLotes({
      search: this.searchTerm() || undefined,
      estadoVencimiento: this.estadoFilter(),
    }).subscribe();
  }

  onSearchChange(val: string): void {
    this.searchTerm.set(val);
    this.cargarDatos();
  }

  setEstadoFilter(estado: 'TODOS' | 'VIGENTE' | 'POR_VENCER' | 'VENCIDO'): void {
    this.estadoFilter.set(estado);
    this.cargarDatos();
  }

  abrirCrearLote(): void {
    const ref = this.dialog.open(LoteFormModalComponent, {
      width: '580px',
      maxWidth: '95vw',
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.cargarDatos();
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}

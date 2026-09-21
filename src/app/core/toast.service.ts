import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; mensaje: string; tono: string; }
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly lista = signal<Toast[]>([]); private id = 1;
  mostrar(mensaje: string, tono = 'exito', duracion = 4000): void {
    const id = this.id++; this.lista.update(x => [...x, { id, mensaje, tono }]);
    if (duracion) setTimeout(() => this.cerrar(id), duracion);
  }
  exito(m: string): void { this.mostrar(m); } error(m: string): void { this.mostrar(m, 'error', 6000); }
  aviso(m: string): void { this.mostrar(m, 'aviso', 5000); }
  cerrar(id: number): void { this.lista.update(x => x.filter(n => n.id !== id)); }
}

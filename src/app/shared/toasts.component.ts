import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toasts', standalone: true,
  template: `<div class="toasts" aria-live="polite">@for(n of toast.lista(); track n.id){<div class="toast toast--{{n.tono}}"><span>{{n.mensaje}}</span><button (click)="toast.cerrar(n.id)">×</button></div>}</div>`,
  styles: [`.toasts{position:fixed;right:1rem;top:1rem;z-index:300;display:grid;gap:.6rem;width:min(380px,calc(100vw - 2rem))}.toast{display:flex;justify-content:space-between;gap:1rem;padding:.9rem 1rem;border-radius:.6rem;background:white;box-shadow:0 12px 35px #08132f38;border-left:5px solid var(--rv-teal)}.toast--error{border-color:#dc3545}.toast--aviso{border-color:#e5a100}.toast button{border:0;background:none;font-size:1.2rem;cursor:pointer}`]
})
export class ToastsComponent { readonly toast = inject(ToastService); }

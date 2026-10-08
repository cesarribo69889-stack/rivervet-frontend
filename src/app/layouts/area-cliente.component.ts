import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Pantallas del cliente con sesión (carrito, sus pedidos y su cuenta) dentro
// del diseño público de la tienda. El cliente nunca entra al diseño interno
// del personal: ninguna HU le pide un panel.
@Component({
  selector: 'app-area-cliente', standalone: true, imports: [RouterOutlet],
  template: `<div class="rv-contenedor area"><router-outlet/></div>`,
  styles: [`.area{padding-block:2.5rem 4.5rem}`]
})
export class AreaClienteComponent {}

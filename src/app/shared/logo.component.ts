import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo', standalone: true,
  template: `
    <span class="logo" [class.logo--claro]="claro()">
      <span class="logo__imagen" [style.width.px]="alto()" [style.height.px]="alto()"><img src="rivervet-profile.png" alt=""></span>
      <span><strong>Rivervet</strong><small>Centro Veterinario</small></span>
    </span>`,
  styles: [`.logo{display:inline-flex;align-items:center;gap:.65rem;color:var(--rv-navy)}.logo--claro{color:white}.logo__imagen{display:block;overflow:hidden;border-radius:13px;background:white;box-shadow:0 5px 15px #08132f20}.logo__imagen img{width:100%;height:100%;object-fit:cover}.logo strong,.logo small{display:block}.logo strong{font:800 1.2rem var(--rv-fuente-titulo);letter-spacing:-.04em}.logo small{font-size:.59rem;text-transform:uppercase;letter-spacing:.12em;font-weight:700;color:var(--rv-teal)}`]
})
export class LogoComponent { alto = input(46); claro = input(false); }

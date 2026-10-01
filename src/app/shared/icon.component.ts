import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @switch (name()) {
        @case ('home') { <path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/> }
        @case ('calendar') { <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/> }
        @case ('paw') { <circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="5" cy="13" r="2"/><circle cx="19" cy="13" r="2"/><path d="M8 18c0-3 2-5 4-5s4 2 4 5c0 2-1.5 3-4 3s-4-1-4-3Z"/> }
        @case ('users') { <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/> }
        @case ('box') { <path d="m21 8-9 5-9-5 9-5 9 5Z"/><path d="m3 8 9 5 9-5v8l-9 5-9-5V8ZM12 13v8"/> }
        @case ('shop') { <path d="M3 9h18l-1-5H4L3 9Z"/><path d="M5 9v11h14V9M9 20v-6h6v6M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/> }
        @case ('shield') { <path d='M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3Z'/><circle cx='12' cy='11' r='2.2'/><path d='M8.6 16.5a3.6 3.6 0 0 1 6.8 0'/> }
        @case ('receipt') { <path d='M6 3h12v18l-3-2-3 2-3-2-3 2V3Z'/><path d='M9 8h6M9 12h6M9 16h4'/> }
        @case ('cart') { <circle cx='9' cy='20' r='1.4'/><circle cx='18' cy='20' r='1.4'/><path d='M2 3h3l2.6 11.4a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 7H6'/> }
        @case ('alert') { <path d='M12 3 2 20h20L12 3Z'/><path d='M12 10v4M12 17h.01'/> }
        @case ('medical') { <path d="M9 4h6M12 1v6M6 9h12v12H6z"/><path d="M9 15h6M12 12v6"/> }
        @case ('vaccine') { <path d="m18 2 4 4M17 7l2-2M5 13l6 6M3 21l4-4M9 15l8-8 2 2-8 8"/> }
        @case ('refresh') { <path d="M20 6v5h-5M4 18v-5h5"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 9M5.5 15A7 7 0 0 0 18 17.5l2-2.5"/> }
        @default { <circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/> }
      }
    </svg>`,
  styles: [`:host{display:inline-grid;width:1.15rem;height:1.15rem;flex:0 0 auto}svg{width:100%;height:100%}`]
})
export class IconComponent { readonly name = input('home'); }

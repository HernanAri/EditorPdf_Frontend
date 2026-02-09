import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {

  private tiempoInactividad: any;


  @HostListener('window:mousemove')

  @HostListener('window:keypress')
  reiniciarContadorInactividad() {
    clearTimeout(this.tiempoInactividad);
  }
}

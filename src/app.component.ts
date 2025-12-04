import { Component, HostListener } from '@angular/core';
import { RouterModule } from '@angular/router';
import { VerificatokenService } from './app/services/verifica-token.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {

  private tiempoInactividad: any;

  constructor(private verificaTokenService: VerificatokenService) {}

  @HostListener('window:mousemove')

  @HostListener('window:keypress')
  reiniciarContadorInactividad() {
    clearTimeout(this.tiempoInactividad);

    this.tiempoInactividad = setTimeout(() => {
      this.verificaTokenService.verificarTiempoDeVidaToken();
    }, 5 * 60 * 1000);
  }
}

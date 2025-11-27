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

  // Detecta movimiento del mouse
  @HostListener('window:mousemove')
  // Detecta teclas
  @HostListener('window:keypress')
  reiniciarContadorInactividad() {
    clearTimeout(this.tiempoInactividad);

    // Después de 5 minutos sin actividad -> verificar token
    this.tiempoInactividad = setTimeout(() => {
      this.verificaTokenService.verificarTiempoDeVidaToken();
    }, 5 * 60 * 1000);
  }
}

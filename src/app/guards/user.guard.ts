import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { VerificatokenService } from "../services/verifica-token.service";


@Injectable({
  providedIn: 'root'
})
export class UserGuard implements CanActivate {

  constructor(
    private verificaTokenService: VerificatokenService,
    private router: Router
  ){ }

  async canActivate(): Promise<boolean> {

    const valido = await this.verificaTokenService.verificarTiempoDeVidaToken();

    if (!valido) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }

}

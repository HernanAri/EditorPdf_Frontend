import { Injectable } from '@angular/core';
import { JwtHelperService } from "@auth0/angular-jwt";
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class VerificatokenService {

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  verificarTiempoDeVidaToken(): boolean | Promise<boolean> {

    const token = sessionStorage.getItem('token');
    if (!token) return false;

    const helper = new JwtHelperService();
    const decoded = helper.decodeToken(token);
    const exp = decoded?.exp;

    if (!exp) {
      this.router.navigate(['/login']);
      return false;
    }

    const expirado = this.tokenExpirado(exp);
    if (expirado) {
      this.router.navigate(['/login']);
      return false;
    }

    return this.verificarRenovacion(exp);
  }

  verificarRenovacion(exp: number): Promise<boolean> {
    return new Promise((resolve, reject) => {

      const tokenExp = moment(exp * 1000);
      const ahora = moment();

      const diffMin = tokenExp.diff(ahora, 'minutes');

      if (diffMin > 5) {
        resolve(true);
        return;
      }

      this.renovarToken().subscribe({
        next: () => resolve(true),
        error: () => {
          this.router.navigate(['/login']);
          reject(false);
        }
      });

    });
  }

  tokenExpirado(exp: number): boolean {
    const ahora = Date.now() / 1000;
    return ahora > exp;
  }

  renovarToken() {
    const login = JSON.parse(sessionStorage.getItem('VariablesDeUsuarioLogado')!)
                  ?.UsuarioLogado?.Login;

    const url = `${environment.apiUrlAutenticacion}/Token/RenovarToken?login=${login}`;

    return this.http.get(url).pipe(
      map((resp: any) => {
        const nuevoToken = resp.NuevoToken;
        sessionStorage.setItem('token', nuevoToken);
        return true;
      })
    );
  }

}

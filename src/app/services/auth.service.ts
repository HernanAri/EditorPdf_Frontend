import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { catchError, filter, map, of, throwError , } from 'rxjs';


declare var $: any;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public header: HttpHeaders = new HttpHeaders().set('content-type', 'application/json');
  private URL_AUTENTICACION: string = environment.apiUrlAutenticacion;
  private URL_AUTENTICACION_AD: string = environment.apiUrlAutenticacionAD;
  private nivelDeAccesoUsuario: any = {};
  public variablesDeUsuarioLogado: any;
  public idiomaNavegador: string;

  public token: string;
  public menu: any[] = [];

  constructor(
    private http: HttpClient
  ) { }


  login(userLogin: any) {

    let login: any = {};
    let url: string = '';

    /* Se valida si se va autenticar por Directorio Activo. */
    if (!userLogin.CheckIsLoginAD) {
      login = { Login: userLogin.Login, Password: userLogin.Password };
      url = `${this.URL_AUTENTICACION}`;

    } else {
      login = { Domain: userLogin.Domain, UserName: userLogin.Login, Password: userLogin.Password };
      url = `${this.URL_AUTENTICACION_AD}`;
    }

    $("#ProcesoAjax").show();
    return this.http.post(url, login, { headers: this.header })
      .pipe(
        map((respuesta: any) => {
          $("#ProcesoAjax").hide();
          if (respuesta) {
           
            if (url.includes('ActiveDirectory')) {
              return respuesta.Datos;
            }
            return respuesta;
          }
        })
        , filter((valor: any, index) => {

          if (valor.VariablesDeUsuarioLogadoDTO.UsuarioLogado) {
            this.nivelDeAccesoUsuario = valor.VariablesDeUsuarioLogadoDTO.NivelAcceso, valor.IdPaisUsuarioLogado, valor.IdCentroImputacion, this.idiomaNavegador;
            this.guardarSesionStorage(valor.Token, valor.VariablesDeUsuarioLogadoDTO, valor.IlMenu, valor.IdPaisUsuarioLogado, valor.IdCentroImputacion);
            sessionStorage.setItem('idSesion', valor.IdSesion);
            return valor;
          } else if (valor.TipoRespuesta === 'No autorizado!!') {
            return of({ ResultadoExitoso: false, error: valor.VariablesDeUsuarioLogadoDTO.ErrorUsuario });
          }
          else {
            // this._messageService.add({ severity: 'error', summary: 'Ups!', detail: "Error inesperado" });
          }

        })
        , catchError((err: any) => {
          if (err.error) {
            // this._messageService.add({ severity: 'error', summary: 'Ups!', detail: err.error });
          } else {
            // this._messageService.add({ severity: 'error', summary: 'Error', detail: "Ocurrió un error al realizar la operación, por favor inténtelo de nuevo o comuníquese con el administrador" });
          }
          $("#ProcesoAjax").hide();
          console.log(JSON.stringify(err));
          return throwError(err);
          return of({ error: err.error, ResultadoExitoso: false });
        })
      );
  }


  guardarSesionStorage(token: string, variablesDeUsuarioLogado: any, menu: any[], idPaisImputado?: string, idCentroImputacion?: string) {

    sessionStorage.setItem('VariablesDeUsuarioLogado', JSON.stringify(variablesDeUsuarioLogado));
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('paisImputacion', idPaisImputado);
    sessionStorage.setItem('centroImputacion', idCentroImputacion);
    sessionStorage.setItem('nivelDeAcceso', JSON.stringify(this.nivelDeAccesoUsuario));
    this.variablesDeUsuarioLogado = variablesDeUsuarioLogado;
    this.menu = menu;
    this.token = token;
  }


  public getV2(url: string, loader = true) {
    if (loader) $("#ProcesoAjax").show();

    return this.http.get(url).pipe(
      map((respuesta: any) => {
        if (loader) $("#ProcesoAjax").hide();

        const exitoso = respuesta.resultadoExitoso ?? respuesta.ResultadoExitoso;
        if (!exitoso) {
          return respuesta.mensaje;
        }
        else {
          return respuesta;
        }
      }),
      catchError((err) => {
        $("#ProcesoAjax").hide();

        return of({ resultadoExitoso: false, error: err });
      })
    );
  }


  loginByIdSersion(idSesion: string) {
    const SISTEMA = "CANS";
    let url: string = `${environment.apiUrlAutenticacionIdSesion}`;
    $("#ProcesoAjax").show();
    const datos = {
      "IdiomaNavegador": "ES",
      "Sistema": SISTEMA,
      "IdSesion": idSesion
    };
    return this.http.post(url, datos, { headers: this.header })
      .pipe(
        map((respuesta: any) => {
          $("#ProcesoAjax").hide();
          if (respuesta)
            return respuesta;
        })
        , filter((valor: any, index) => {

          if (valor.VariablesDeUsuarioLogadoDTO.UsuarioLogado) {
            this.nivelDeAccesoUsuario = valor.VariablesDeUsuarioLogadoDTO.NivelAcceso, valor.IdPaisUsuarioLogado, valor.IdCentroImputacion, this.idiomaNavegador;
            this.guardarSesionStorage(valor.Token, valor.VariablesDeUsuarioLogadoDTO, valor.IlMenu, valor.IdPaisUsuarioLogado, valor.IdCentroImputacion);
            sessionStorage.setItem('idSesion', valor.IdSesion);
            return valor;
          } else if (valor.TipoRespuesta === 'No autorizado!!') {
            return of({ ResultadoExitoso: false, error: valor.VariablesDeUsuarioLogadoDTO.ErrorUsuario });
          }
        })
        , catchError((err: any) => {
          $("#ProcesoAjax").hide();
          return of({ error: err.error, ResultadoExitoso: false });
        })
      );
  }


}
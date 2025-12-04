import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { JwtHelperService } from "@auth0/angular-jwt";

declare var $: any;

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  constructor(
    private http: HttpClient
  ) { }

  public get(url: string, loader = true) {

    if (loader) $("#ProcesoAjax").show();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });
    return this.http.get(url, { headers }).pipe(
      map((respuesta: any) => {
        if (loader) $("#ProcesoAjax").hide();
        if (!respuesta.successfulResult) {
          return respuesta.mensaje;
        }
        else {
          return respuesta;
        }
      }),
      catchError((err) => {
        $("#ProcesoAjax").hide();

        return of({ successfulResult: false, error: err });
      })
    );
  }


  public post(url: string, data: any, loader = true) {

    if (loader) $("#ProcesoAjax").show();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    return this.http.post(url, data, { headers }).pipe(
      map((respuesta: any) => {
        if (loader) $("#ProcesoAjax").hide();
        if (!respuesta.successfulResult) {
          return respuesta;
        }
        else {
          return respuesta;
        }
      }),
      catchError((err) => {

        $("#ProcesoAjax").hide();
        return of({ successfulResult: false, error: err });
      })
    );
  }

  public postFile(url: string, file: File, loader = true) {
    if (loader) $("#ProcesoAjax").show();

    const formData = new FormData();
    formData.append('file', file);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    return this.http.post(url, formData, { headers }).pipe(
      map((respuesta: any) => {
        if (loader) $("#ProcesoAjax").hide();

        if (!respuesta.successfulResult) {
          return respuesta;
        } else {
          return respuesta;
        }
      }),
      catchError((err) => {
        if (loader) $("#ProcesoAjax").hide();
        return of({ successfulResult: false, error: err });
      })
    );
  }


  public postV2(url: string, data: any, loader = true) {

    if (loader) $("#ProcesoAjax").show();

    return this.http.post(url, data).pipe(
      map((respuesta: any) => {
        if (loader) $("#ProcesoAjax").hide();
        if (!respuesta.successfulResult) {
          return respuesta;
        }
        else {
          return respuesta;
        }
      }),
      catchError((err) => {
        $("#ProcesoAjax").hide();
        return of({ successfulResult: false, error: err });
      })
    );
  }


  public put(url: string, data: any, loader = true) {

    if (loader) $("#ProcesoAjax").show();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    return this.http.put(url, data, { headers }).pipe(
      map((respuesta: any) => {
        if (loader) $("#ProcesoAjax").hide();
        if (!respuesta.successfulResult) {
          return respuesta;
        }
        else {
          return respuesta;
        }
      }),
      catchError((err) => {
        $("#ProcesoAjax").hide();
        return of({ successfulResult: false, error: err });
      })
    );
  }

  public putV2(url: string, loader = true) {

    if (loader) $("#ProcesoAjax").show();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    return this.http.put(url, { headers }).pipe(
      map((respuesta: any) => {
        if (loader) $("#ProcesoAjax").hide();
        if (!respuesta.successfulResult) {
          return respuesta;
        }
        else {
          return respuesta;
        }
      }),
      catchError((err) => {
        $("#ProcesoAjax").hide();
        return of({ successfulResult: false, error: err });
      })
    );
  }


  public delete(url: string, loader = true) {

    if (loader) $("#ProcesoAjax").show();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${sessionStorage.getItem('token')}`
    });

    return this.http.delete(url, { headers }).pipe(
      map((respuesta: any) => {
        if (loader) $("#ProcesoAjax").hide();
        if (!respuesta.successfulResult) {
          return respuesta;
        }
        else {
          return respuesta;
        }
      }),
      catchError((err) => {
        $("#ProcesoAjax").hide();
        return of({ successfulResult: false, error: err });
      })
    );
  }


  isAutenticated(): boolean {

    const token = sessionStorage.getItem('token') || '';

    if (token) {

      try {
        const helper = new JwtHelperService();
        const decodedToken = helper.decodeToken(token);

        if (!decodedToken) {
          sessionStorage.removeItem('token');
          return false;
        }
      } catch (error) {
        sessionStorage.removeItem('token');
        return false;
      }

      return true;

    } else {
      return false;
    }

  }

}
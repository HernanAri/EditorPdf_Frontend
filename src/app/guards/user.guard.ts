import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { UsuarioService } from "../services/usuario.service";


@Injectable({
  providedIn: 'root'
})


export class UserGuard implements CanActivate {

  constructor(
    private _usuarioService: UsuarioService,
    private _router: Router){}
  
  canActivate(): any {

    if(!this._usuarioService.isAutenticated()) {
      this._router.navigate(['/login']);
      return false;
    } 

    return true;
  }

}
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../../layout/component/app.floatingconfigurator';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { SelectModule } from 'primeng/select';
import { ToolsService } from '../../../services/general/tools/tools.service';
import { AuthService } from '../../../services/auth.service';
import { PERMISOS } from '../../../consts/permisos.conts';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '../../../layout/service/layout.service';

declare var $: any;

@Component({
  selector: 'app-login',
  imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, MessageModule, ToastModule, SelectModule, CommonModule],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  public usuario: string = '';
  public password: string = '';

  public checkIsLoginAD: boolean = false;
  public domain: string = '';
  public domains: any[] = [];
  activateRouter = inject(ActivatedRoute)
  private URL_DOMINIOS: string = environment.apiUrlDominio;

  constructor(
    private _messageService: MessageService,
    private _authService: AuthService,
    private _toolsService: ToolsService,
    private _router: Router,
    private _layoutService: LayoutService
  ) { }

  ngOnInit() {
    this.activateRouter.params
      .subscribe((parametro: any) => {
        if (!parametro.idSesion) { return; }
        this.loginByIdSesion(parametro.idSesion);
      });
  }

  loginByIdSesion(idSesion: string) {
    this._authService.loginByIdSersion(idSesion)
      .subscribe((respuesta: any) => {
        if (respuesta.IlMenu) this._router.navigate(['/grupo-familiar-puesto']);
        else this._messageService.add({ severity: 'error', summary: 'Error', detail: 'El usuario no tiene acceso al sistema' });
      });
  }


  iniciarSesion() {

    if (this.password == '' || this.usuario == '') {
      this._messageService.add({ severity: 'error', summary: 'Error', detail: 'Todos los campos son requeridos' });
    } else {

      if (!this.usuario && !this.password) { return; }

      /* Se valida que si se esta ingresando por AD sea requerido el dominio. */
      if (this.checkIsLoginAD && !this.domain) {
        this._messageService.add({ severity: 'warn', summary: '', detail: 'Selecciona un dominio' });
        return;
      }
      // Se valida si viene definido el dominio para encriptarlo.
      if (this.checkIsLoginAD) { this.domain = this._toolsService.encrypt(this.domain); }
      let userLogin: any = { 'Domain': this.domain, 'Login': this._toolsService.encrypt(this.usuario), 'Password': this._toolsService.encrypt(this.password), 'CheckIsLoginAD': this.checkIsLoginAD }

      this._authService.login(userLogin)
        .subscribe((respuesta: any) => {

          if (respuesta.ResultadoExitoso || respuesta.Token) {
            if ([PERMISOS.ADMIN].some(valor => respuesta.VariablesDeUsuarioLogadoDTO.Permisos.includes(valor))) {
              this._router.navigate(['/dashboard']);
              return;
            } else {
              this._messageService.add({ severity: 'error', summary: 'Error', detail: 'El usuario no tiene permisos para ingresar a la aplicación' });
              sessionStorage.clear();
            }
          }

          if (!respuesta.ResultadoExitoso && respuesta?.error?.message) {
            this._messageService.add({ severity: 'error', summary: 'Error', detail: respuesta.error.message });
          }

          if (!respuesta?.ResultadoExitoso) {
            this._messageService.add({ severity: 'error', summary: 'Error', detail: respuesta.VariablesDeUsuarioLogadoDTO.ErrorUsuario });
            return;
          }

        });
    }
  }


  cargarDominios() {
    if (this.domains.length == 0) {
      this.obtenerListaDominiosDirectorioActivo();
    }
  }


  obtenerListaDominiosDirectorioActivo() {
    this._authService.getV2(`${this.URL_DOMINIOS}`).subscribe(resp => {
      this.domains = resp.Datos;
    });
  }


}

import { Routes } from '@angular/router';
import { AppLayout } from '../layout/component/app.layout';
import { UserGuard } from '../guards/user.guard';
import { LoginComponent } from './auth/login/login.component';
import { Landing } from './landing/landing';
import { Notfound } from './notfound/notfound';


export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    canActivate: [UserGuard],
    children: [
      {
        path: 'pdf',
        children: [
          {
            path: 'upload',
            loadComponent: () =>
              import('../pages/pdf/upload/upload.component')
                .then(m => m.UploadComponent),
            canActivate: [UserGuard]
          },
         /* {
            path: 'editor/:id',
            loadComponent: () =>
              import('./app/pages/pdf/editor/editor.component')
                .then(m => m.EditorComponent),
            canActivate: [UserGuard]
          },*/
          {
            path: '',
            redirectTo: 'upload',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: '',
        redirectTo: 'pdf/upload',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'login/:idSesion',
    component: LoginComponent
  },
  {
    path: 'landing',
    component: Landing
  },
  {
    path: 'notfound',
    component: Notfound
  },
  {
    path: '**',
    redirectTo: 'notfound'
  }
];

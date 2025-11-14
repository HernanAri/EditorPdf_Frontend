import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { LoginComponent } from './app/pages/auth/login/login.component';
import { UserGuard } from './app/guards/user.guard';
import { PdfWorkflowComponent } from './app/pages/pdf/pdf-workflow/pdf-workflow.component';

export const appRoutes: Routes = [
  {
    path: '',
    canActivate: [UserGuard],
    component: AppLayout,
    children: [
      {
        path: 'pdf/workflow',
        component: PdfWorkflowComponent,
        canActivate: [UserGuard]
      },
      {
        path: '',
        redirectTo: 'pdf/workflow',
        pathMatch: 'full'
      }
    ]
  },
  { path: 'landing', component: Landing },
  { path: 'notfound', component: Notfound },
  { path: 'login', component: LoginComponent },
  { path: 'login/:idSesion', component: LoginComponent },
  { path: '**', redirectTo: '/pdf/workflow' }
];

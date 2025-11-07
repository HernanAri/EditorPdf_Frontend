import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { LoginComponent } from './app/pages/auth/login/login.component';
import { UserGuard } from './app/guards/user.guard';

export const appRoutes: Routes = [
    {
        path: '', canActivate: [UserGuard],
        component: AppLayout,
        children: [
            { path: 'dashboard', component: Dashboard, canActivate: [UserGuard] },
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'login', component: LoginComponent },
    { path: 'login/:idSesion', component: LoginComponent },
    { path: '**', redirectTo: '/notfound' }
    { path: 'pdf/upload', component: UploadComponent}
];

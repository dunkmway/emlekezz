import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { DefaultLayout } from './layouts/default/default.layout';
import { LoginPage } from './pages/login/login.page';
import { authGuard } from './guards/auth.guard';
import { unAuthGuard } from './guards/unauth.guard';

export const routes: Routes = [
  {
    path: '',
    component: DefaultLayout,
    children: [
      {
        path: 'login',
        component: LoginPage,
        canActivate: [unAuthGuard],
      },
      {
        path: '',
        pathMatch: 'full',
        component: HomePage,
        canActivate: [authGuard],
      },
      { path: '**', component: HomePage },
    ],
  },
];

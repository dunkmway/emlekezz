import { Routes } from '@angular/router';
import { HomePage } from './pages/home/home.page';
import { DefaultLayout } from './layouts/default/default.layout';

export const routes: Routes = [
  {
    path: '',
    component: DefaultLayout,
    children: [
      { path: '', pathMatch: 'full', component: HomePage },
      { path: '**', component: HomePage },
    ],
  },
];

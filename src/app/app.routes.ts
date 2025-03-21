import { Routes } from '@angular/router';
import { authResolver } from './auth.resolver';
import { AuthComponent } from './auth/auth.component';
import { MainComponent } from './main/main.component';

export const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    resolve: { auth: authResolver },
  },
  {
    path: 'auth',
    component: AuthComponent,
  },
];

import { Component } from '@angular/core';
import { AuthTgComponent } from './auth-tg/auth-tg.component';
import { AuthService } from './auth.service';
import { AuthComponent } from './auth/auth.component';
import { MainComponent } from './main/main.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [AuthTgComponent, MainComponent, AuthComponent],
})
export class AppComponent {
  protected get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  constructor(protected authService: AuthService) {}
}

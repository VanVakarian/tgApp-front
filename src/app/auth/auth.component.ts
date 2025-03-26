import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  imports: [FormsModule, CommonModule],
})
export class AuthComponent implements OnInit {
  protected username = signal('');
  protected password = signal('');
  protected authStatus = signal('');
  protected isLoading = signal(false);
  protected isAuthenticated = computed(() => this.authService.isAuthenticated());

  private previousAuthState = false;

  constructor(private authService: AuthService, private router: Router) {
    effect(() => {
      const currentAuthState = this.isAuthenticated();
      if (currentAuthState && !this.previousAuthState) {
        this.router.navigate(['/']);
      }
      this.previousAuthState = currentAuthState;
    });
  }

  public ngOnInit() {
    if (this.isAuthenticated()) {
      const savedUsername = this.authService.getUsername();
      if (savedUsername) {
        this.username.set(savedUsername);
      }
    }
  }

  protected async submitCredentials() {
    if (!this.username() || !this.password()) {
      this.authStatus.set('Please fill in all fields');
      return;
    }

    this.isLoading.set(true);
    this.authStatus.set('');

    try {
      await this.authService.login(this.username(), this.password());
      this.password.set('');
    } catch (error) {
      console.error('Error submitting credentials', error);
      this.authStatus.set(error instanceof Error ? error.message : 'Error submitting credentials');
    } finally {
      this.isLoading.set(false);
    }
  }

  protected logout() {
    this.authService.logout();
    this.username.set('');
    this.password.set('');
    this.authStatus.set('');
  }
}

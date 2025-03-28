import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { AuthService } from '../auth.service';
import { TelegramAuthService } from '../tg-auth.service';

@Component({
  selector: 'app-auth-tg',
  templateUrl: './auth-tg.component.html',
  imports: [FormsModule, CommonModule],
})
export class AuthTgComponent implements OnDestroy {
  protected phone = '';
  protected password = '';
  protected code = '';
  protected showCodeInput = false;
  protected authStatus = '';
  protected error = '';

  private subscription: Subscription = new Subscription();

  protected get isTgAuthenticated(): boolean {
    return this.telegramAuthService.isAuthenticated();
  }

  constructor(protected telegramAuthService: TelegramAuthService, private authService: AuthService) {
    if (this.authService.isAuthenticated()) {
      this.connectSSE();
    }
  }

  public ngOnDestroy(): void {
    this.telegramAuthService.disconnectSSE();
    this.subscription.unsubscribe();
  }

  protected async submitCredentials(): Promise<void> {
    try {
      this.error = '';
      const response = await firstValueFrom(this.telegramAuthService.submitCredentials(this.phone, this.password));

      if (!response.success) {
        this.error = response.message || 'Authentication error';
        return;
      }

      if (response.requiresCode) {
        this.showCodeInput = true;
        this.authStatus = 'Enter confirmation code';
      }
    } catch (error: any) {
      console.error('Error submitting Telegram credentials', error);
      this.error = error.error?.message || 'Error sending credentials';
      this.resetForm();
    }
  }

  protected async submitCode(): Promise<void> {
    try {
      this.error = '';
      const response = await firstValueFrom(this.telegramAuthService.submitCode(this.code));

      if (!response.success) {
        this.error = response.message || 'Authentication error';
        return;
      }

      this.showCodeInput = false;
      this.telegramAuthService.isAuthenticated.set(true);
    } catch (error: any) {
      console.error('Error submitting Telegram code', error);
      this.error = error.error?.message || 'Error sending code';
      this.resetForm();
    }
  }

  protected async logout(): Promise<void> {
    try {
      this.error = '';
      const response = await firstValueFrom(this.telegramAuthService.logout());

      if (!response.success) {
        this.error = response.message || 'Error logging out';
        return;
      }

      this.resetForm();
    } catch (error: any) {
      console.error('Error logging out from Telegram', error);
      this.error = error.error?.message || 'Error logging out';
    }
  }

  private async connectSSE(): Promise<void> {
    this.telegramAuthService.connectToSSE();

    this.subscription.add(
      this.telegramAuthService.sseEvents$.subscribe((event) => {
        if (event.event === 'auth_required') {
          this.resetForm();
          this.error = event.data;
        }
      })
    );
  }

  private resetForm() {
    this.showCodeInput = false;
    this.authStatus = '';
    this.password = '';
    this.code = '';
  }
}

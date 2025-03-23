import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TelegramAuthService } from '../tg-auth.service';

@Component({
  selector: 'app-auth-tg',
  templateUrl: './auth-tg.component.html',
  standalone: true,
  imports: [FormsModule, CommonModule],
})
export class AuthTgComponent implements OnInit, OnDestroy {
  phone = '';
  password = '';
  code = '';
  showCodeInput = false;
  authStatus = '';
  error = '';

  private subscription: Subscription = new Subscription();

  constructor(private telegramAuthService: TelegramAuthService) {}

  ngOnInit(): void {
    this.telegramAuthService.connectToSSE();

    this.subscription.add(
      this.telegramAuthService.sseEvents$.subscribe((event: any) => {
        console.log('Telegram SSE event', event);

        if (event.event === 'auth_required') {
          this.resetForm();
          this.error = event.data;
        } else if (event.event === 'auth_status') {
          if (event.data === 'success') {
            this.authStatus = 'Авторизация успешна';
            this.showCodeInput = false;
            this.error = '';
          } else if (event.data.startsWith('failure:')) {
            this.error = event.data.substring(9);
            this.resetForm();
          }
        }
      })
    );

    this.subscription.add(
      this.telegramAuthService.isAuthorized$.subscribe((isAuth) => {
        if (!isAuth) {
          this.resetForm();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.telegramAuthService.disconnectSSE();
    this.subscription.unsubscribe();
  }

  submitCredentials() {
    this.error = '';
    this.telegramAuthService.submitCredentials(this.phone, this.password).subscribe({
      next: (response: any) => {
        console.log('Telegram credentials response:', response);
        if (response.requiresCode) {
          this.showCodeInput = true;
          this.authStatus = 'Введите код подтверждения';
        } else if (response.event === 'auth_status' && response.data === 'success') {
          this.authStatus = 'Авторизация успешна';
        }
      },
      error: (error: any) => {
        console.error('Error submitting Telegram credentials', error);
        this.error = error.error?.data || 'Ошибка при отправке учетных данных';
        this.resetForm();
      },
    });
  }

  submitCode() {
    this.error = '';
    this.telegramAuthService.submitCode(this.code, this.phone).subscribe({
      next: (response: any) => {
        console.log('Telegram code response:', response);
        if (response.event === 'auth_status' && response.data === 'success') {
          this.authStatus = 'Авторизация успешна';
          this.showCodeInput = false;
        }
      },
      error: (error: any) => {
        console.error('Error submitting Telegram code', error);
        this.error = error.error?.data || 'Ошибка при отправке кода';
        this.resetForm();
      },
    });
  }

  private resetForm() {
    this.showCodeInput = false;
    this.authStatus = '';
    this.password = '';
    this.code = '';
  }
}

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TelegramAuthService } from '../tg-auth.service';

@Component({
  selector: 'app-auth-tg',
  templateUrl: './auth-tg.component.html',
  imports: [FormsModule, CommonModule],
})
export class AuthTgComponent implements OnInit, OnDestroy {
  phone = '';
  password = '';
  code = '';
  showCodeInput = false;
  authStatus = '';
  private subscription: Subscription = new Subscription();

  constructor(private telegramAuthService: TelegramAuthService) {}

  ngOnInit(): void {
    this.telegramAuthService.connectToSSE();
    this.subscription.add(
      this.telegramAuthService.sseEvents$.subscribe((event: any) => {
        console.log('Telegram SSE event', event);
        if (event && event.data === 'Enter phone and password') {
          this.showCodeInput = false;
          this.authStatus = 'Enter your phone and password';
        } else if (event && event.data === 'Enter code') {
          this.showCodeInput = true;
          this.authStatus = 'Enter the code you received';
        } else if (event && event.event === 'auth_status') {
          this.authStatus = event.data;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.telegramAuthService.disconnectSSE();
    this.subscription.unsubscribe();
  }

  submitCredentials() {
    this.telegramAuthService.submitCredentials(this.phone, this.password).subscribe({
      next: (response: any) => {
        console.log('Telegram credentials submitted successfully', response);
      },
      error: (error: any) => {
        console.error('Error submitting Telegram credentials', error);
        this.authStatus = 'Error submitting credentials';
      },
    });
  }

  submitCode() {
    this.telegramAuthService.submitCode(this.code).subscribe({
      next: (response: any) => {
        console.log('Telegram code submitted successfully', response);
      },
      error: (error: any) => {
        console.error('Error submitting Telegram code', error);
        this.authStatus = 'Error submitting code';
      },
    });
  }
}

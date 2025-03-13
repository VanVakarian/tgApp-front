import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-auth-tg',
  templateUrl: './auth-tg.component.html',
  imports: [FormsModule, CommonModule],
})
export class AuthTgComponent implements OnInit {
  phone = '';
  password = '';
  code = '';
  showCodeInput = false;
  authStatus = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.connectToSSE();
    this.authService.sseEvents$.subscribe((event: any) => {
      console.log('SSE event', event);
      if (event.data === 'Enter phone and password') {
        this.showCodeInput = false;
        this.authStatus = 'Enter your phone and password';
      } else if (event.data === 'Enter code') {
        this.showCodeInput = true;
        this.authStatus = 'Enter the code you received';
      } else if (event.event === 'auth_status') {
        this.authStatus = event.data;
      }
    });
  }

  submitCredentials() {
    this.authService.submitCredentials(this.phone, this.password).subscribe({
      next: (response: any) => {
        console.log('Credentials submitted successfully', response);
      },
      error: (error: any) => {
        console.error('Error submitting credentials', error);
        this.authStatus = 'Error submitting credentials';
      },
    });
  }

  submitCode() {
    this.authService.submitCode(this.code).subscribe({
      next: (response: any) => {
        console.log('Code submitted successfully', response);
      },
      error: (error: any) => {
        console.error('Error submitting code', error);
        this.authStatus = 'Error submitting code';
      },
    });
  }
}

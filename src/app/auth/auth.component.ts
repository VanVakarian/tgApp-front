import { CommonModule } from '@angular/common';
import { Component, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  imports: [FormsModule, CommonModule],
  standalone: true,
})
export class AuthComponent implements OnInit {
  username = '';
  password = '';
  authStatus = '';
  isAuthenticated = false;

  constructor(private authService: AuthService, private router: Router) {
    effect(() => {
      this.isAuthenticated = this.authService.authenticationStatus$();
    });
  }

  ngOnInit() {
    this.isAuthenticated = this.authService.checkAuth();
    if (this.isAuthenticated) {
      const savedUsername = this.authService.getUsername();
      if (savedUsername) {
        this.username = savedUsername;
      }
    }
  }

  submitCredentials() {
    this.authService.login(this.username, this.password).subscribe({
      next: (response: any) => {
        console.log('Credentials submitted successfully', response);
        this.isAuthenticated = true;
        this.authStatus = '';
      },
      error: (error: any) => {
        console.error('Error submitting credentials', error);
        this.authStatus = 'Error submitting credentials';
      },
    });
  }

  logout() {
    this.authService.logout();
    this.username = '';
    this.password = '';
    this.authStatus = '';
    this.isAuthenticated = false;
  }
}

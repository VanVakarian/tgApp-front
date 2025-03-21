import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject, Observable, tap } from 'rxjs';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

interface JwtToken {
  exp: number;
  iat: number;
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USERNAME_KEY = 'username';
  public authenticationStatus$$ = signal(false);
  public authenticationStatus$ = this.authenticationStatus$$.asReadonly();
  private sseSubject = new BehaviorSubject<any>(null);
  public sseEvents$: Observable<any> = this.sseSubject.asObservable();

  constructor(private http: HttpClient) {}

  public login(username: string, password: string): Observable<any> {
    return this.http.post<AuthResponse>('/api/auth/login', { username, password }).pipe(
      tap((response: AuthResponse) => {
        if (response?.accessToken && response?.refreshToken) {
          this.setTokens(response);
          localStorage.setItem(this.USERNAME_KEY, username);
          this.authenticationStatus$$.set(true);
        } else {
          throw new Error('Auth failed');
        }
      })
    );
  }

  public checkAuth(): boolean {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      this.authenticationStatus$$.set(false);
      return false;
    }

    try {
      const decoded = jwtDecode<JwtToken>(accessToken);
      console.log('Decoded token:', decoded);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        this.logout();
        return false;
      }

      this.authenticationStatus$$.set(true);
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  public getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  public getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  public refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken }).pipe(
      tap((response: AuthResponse) => {
        if (response?.accessToken && response?.refreshToken) {
          this.setTokens(response);
          this.authenticationStatus$$.set(true);
        } else {
          throw new Error('Token refresh failed');
        }
      })
    );
  }

  private setTokens(authResponse: AuthResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, authResponse.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResponse.refreshToken);
  }

  public logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    this.authenticationStatus$$.set(false);
  }
}

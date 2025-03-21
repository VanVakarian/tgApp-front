import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { firstValueFrom } from 'rxjs';

enum ApiAuthPaths {
  LOGIN = '/api/auth/login',
  REFRESH = '/api/auth/refresh',
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

interface JwtToken {
  exp: number;
  iat: number;
  username: string;
}

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
  isRefreshing: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USERNAME_KEY = 'username';

  private http = inject(HttpClient);

  private authState = signal<AuthState>({
    isAuthenticated: false,
    accessToken: localStorage.getItem(this.ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(this.REFRESH_TOKEN_KEY),
    username: localStorage.getItem(this.USERNAME_KEY),
    isRefreshing: false,
  });

  public isAuthenticated = computed(() => this.authState().isAuthenticated);
  public username = computed(() => this.authState().username);
  public isRefreshing = computed(() => this.authState().isRefreshing);

  constructor() {
    this.checkAuth();
  }

  public getAccessToken(): string | null {
    return this.authState().accessToken;
  }

  public getRefreshToken(): string | null {
    return this.authState().refreshToken;
  }

  public getUsername(): string | null {
    return this.authState().username;
  }

  public async login(username: string, password: string): Promise<void> {
    try {
      const res = await firstValueFrom(this.http.post<AuthResponse>(ApiAuthPaths.LOGIN, { username, password }));

      if (res?.accessToken && res?.refreshToken) {
        this.setTokens(res);
        localStorage.setItem(this.USERNAME_KEY, username);
        this.updateAuthState({
          isAuthenticated: true,
          username,
        });
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      this.updateAuthState({ isAuthenticated: false });
      throw error;
    }
  }

  public logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USERNAME_KEY);

    this.updateAuthState({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      username: null,
    });
  }

  public checkAuth(): boolean {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      this.updateAuthState({ isAuthenticated: false });
      return false;
    }

    try {
      if (this.isTokenExpired(accessToken)) {
        this.logout();
        return false;
      }

      const decoded = this.decodeToken(accessToken);
      this.updateAuthState({
        isAuthenticated: true,
        username: decoded.username,
      });
      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  private decodeToken(token: string): JwtToken {
    return jwtDecode<JwtToken>(token);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      return Date.now() / 1000 >= decoded.exp;
    } catch {
      return true;
    }
  }

  public async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this.updateAuthState({ isRefreshing: true });

    try {
      const res = await firstValueFrom(this.http.post<AuthResponse>(ApiAuthPaths.REFRESH, { refreshToken }));

      if (res?.accessToken && res?.refreshToken) {
        this.setTokens(res);
        const decoded = this.decodeToken(res.accessToken);
        this.updateAuthState({
          isAuthenticated: true,
          isRefreshing: false,
          username: decoded.username,
        });
        return res;
      }
      throw new Error('Token refresh failed');
    } catch (error) {
      this.updateAuthState({ isRefreshing: false });
      this.logout();
      throw error;
    }
  }

  private setTokens(authResponse: AuthResponse): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, authResponse.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResponse.refreshToken);

    this.updateAuthState({
      accessToken: authResponse.accessToken,
      refreshToken: authResponse.refreshToken,
    });
  }

  private updateAuthState(partialState: Partial<AuthState>): void {
    this.authState.update((state) => ({
      ...state,
      ...partialState,
    }));
  }
}

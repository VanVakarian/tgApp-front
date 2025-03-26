import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';
import { AuthService } from './auth.service';

enum TgAuthRoutes {
  CREDS = '/api/auth-tg/creds',
  CODE = '/api/auth-tg/code',
  CLEAR = '/api/auth-tg/clear',
  SSE = '/api/auth-tg/sse',
}

interface AuthStatusData {
  isTgAuthenticated: boolean;
}

interface TelegramAuthResponse {
  success: boolean;
  requiresCode?: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TelegramAuthService {
  public sseEvents$ = new Subject<any>();

  public isAuthenticated = signal<boolean>(false);

  private sseUrl = TgAuthRoutes.SSE;
  private sseEventSource: EventSource | null = null;
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {}

  public connectToSSE(): void {
    if (this.sseEventSource) {
      this.disconnectSSE();
    }

    const accessToken = this.authService.getAccessToken();
    const url = new URL(this.sseUrl, window.location.origin);
    if (accessToken) {
      url.searchParams.append('token', accessToken);
    }

    this.sseEventSource = new EventSource(url.toString());

    this.sseEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.sseEvents$.next(data);

        if (data.event === 'auth_status') {
          const authStatus = data.data as AuthStatusData;
          this.isAuthenticated.set(authStatus.isTgAuthenticated);
        }
      } catch (e) {
        this.sseEvents$.next({ event: 'error', data: 'Invalid message format' });
      }
    };

    this.sseEventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.sseEvents$.next({ event: 'error', data: 'Connection error' });
      this.reconnectSSE();
    };
  }

  public submitCredentials(phone: string, password: string): Observable<TelegramAuthResponse> {
    const accessToken = this.authService.getAccessToken();
    const headers = new HttpHeaders(accessToken ? { Authorization: `Bearer ${accessToken}` } : {});

    return this.http.post<TelegramAuthResponse>(TgAuthRoutes.CREDS, { phone, password }, { headers });
  }

  public submitCode(code: string): Observable<TelegramAuthResponse> {
    const accessToken = this.authService.getAccessToken();
    const headers = new HttpHeaders(accessToken ? { Authorization: `Bearer ${accessToken}` } : {});

    return this.http.post<TelegramAuthResponse>(TgAuthRoutes.CODE, { code }, { headers }).pipe(
      tap((response) => {
        if (response.success) {
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  public logout(): Observable<TelegramAuthResponse> {
    const accessToken = this.authService.getAccessToken();
    const headers = new HttpHeaders(accessToken ? { Authorization: `Bearer ${accessToken}` } : {});
    return this.http.post<TelegramAuthResponse>(TgAuthRoutes.CLEAR, {}, { headers }).pipe(
      tap((response) => {
        if (response.success) {
          this.isAuthenticated.set(false);
        }
      })
    );
  }

  public disconnectSSE(): void {
    if (this.sseEventSource) {
      this.sseEventSource.close();
      this.sseEventSource = null;
    }
  }

  private reconnectSSE(): void {
    if (this.sseEventSource) {
      this.disconnectSSE();
      setTimeout(() => this.connectToSSE(), 5000);
    }
  }
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

interface TelegramAuthResponse {
  event: string;
  data: string;
  requiresCode?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TelegramAuthService {
  public sseEvents$ = new Subject<any>();

  private _isAuthorized = new BehaviorSubject<boolean>(false);
  public isAuthorized$ = this._isAuthorized.asObservable();

  private sseUrl = '/api/auth-tg/sse';
  private sseEventSource: EventSource | null = null;
  private authService = inject(AuthService);

  constructor(private http: HttpClient) {
    this.checkInitialAuthState();
  }

  private checkInitialAuthState(): void {
    const authState = localStorage.getItem('tgAuthState');
    this._isAuthorized.next(authState === 'authorized');
  }

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

        if (data.event === 'auth_status' && data.data === 'success') {
          this._isAuthorized.next(true);
          localStorage.setItem('tgAuthState', 'authorized');
        }
      } catch (e) {
        this.sseEvents$.next({ event: 'error', data: 'Invalid message format' });
      }
    };

    this.sseEventSource.addEventListener('auth_status', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        this.sseEvents$.next({ event: 'auth_status', data: data.data });

        if (data.data === 'success') {
          this._isAuthorized.next(true);
          localStorage.setItem('tgAuthState', 'authorized');
        }
      } catch (e) {
        this.sseEvents$.next({ event: 'auth_status', data: event.data });
      }
    });

    this.sseEventSource.addEventListener('auth_required', () => {
      this._isAuthorized.next(false);
      localStorage.removeItem('tgAuthState');
    });

    this.sseEventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.sseEvents$.next({ event: 'error', data: 'Connection error' });
      this.reconnectSSE();
    };
  }

  private reconnectSSE(): void {
    if (this.sseEventSource) {
      this.disconnectSSE();

      setTimeout(() => this.connectToSSE(), 5000);
    }
  }

  disconnectSSE(): void {
    if (this.sseEventSource) {
      this.sseEventSource.close();
      this.sseEventSource = null;
    }
  }

  submitCredentials(phone: string, password: string): Observable<TelegramAuthResponse> {
    const accessToken = this.authService.getAccessToken();
    const headers = new HttpHeaders(accessToken ? { Authorization: `Bearer ${accessToken}` } : {});

    return this.http.post<TelegramAuthResponse>('/api/auth-tg/creds', { phone, password }, { headers }).pipe(
      tap((response) => {
        if (response.event === 'auth_status' && response.data === 'success') {
          this._isAuthorized.next(true);
          localStorage.setItem('tgAuthState', 'authorized');
        }
      })
    );
  }

  submitCode(code: string, phone: string): Observable<TelegramAuthResponse> {
    const accessToken = this.authService.getAccessToken();
    const headers = new HttpHeaders(accessToken ? { Authorization: `Bearer ${accessToken}` } : {});

    return this.http.post<TelegramAuthResponse>('/api/auth-tg/code', { code, phone }, { headers }).pipe(
      tap((response) => {
        if (response.event === 'auth_status' && response.data === 'success') {
          this._isAuthorized.next(true);
          localStorage.setItem('tgAuthState', 'authorized');
        }
      })
    );
  }
}

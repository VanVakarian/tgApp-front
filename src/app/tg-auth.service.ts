import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TelegramAuthService {
  private sseEventSource: EventSource | null = null;
  public sseEvents$ = new Subject<any>();

  constructor(private http: HttpClient) {}

  connectToSSE(): void {
    this.sseEventSource = new EventSource('/api/auth-tg/sse');

    this.sseEventSource.onmessage = (event) => {
      this.sseEvents$.next({ data: event.data });
    };

    this.sseEventSource.addEventListener('auth_status', (event: any) => {
      this.sseEvents$.next({ event: 'auth_status', data: event.data });
    });

    this.sseEventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.sseEvents$.next({ event: 'error', data: 'Connection error' });
      this.sseEventSource?.close();
    };
  }

  disconnectSSE(): void {
    if (this.sseEventSource) {
      this.sseEventSource.close();
      this.sseEventSource = null;
    }
  }

  submitCredentials(phone: string, password: string): Observable<any> {
    return this.http.post('/api/auth-tg/auth', { phone, password });
  }

  submitCode(code: string): Observable<any> {
    return this.http.post('/api/auth-tg/code', { code });
  }
}

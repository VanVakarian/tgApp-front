import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private sseSubject = new Subject<any>();
  public sseEvents$: Observable<any> = this.sseSubject.asObservable();

  constructor(private http: HttpClient) {}

  connectToSSE() {
    const eventSource = new EventSource('/api/auth/request');

    eventSource.onmessage = (event) => {
      this.sseSubject.next(event);
    };

    eventSource.onerror = (error) => {
      console.error('SSE error', error);
      this.sseSubject.error(error);
    };
  }

  submitCredentials(phone: string, password: string): Observable<any> {
    return this.http.post<any>('/api/auth/credentials', { phone, password });
  }

  submitCode(code: string): Observable<any> {
    return this.http.post<any>('/api/auth/code', { code });
  }
}

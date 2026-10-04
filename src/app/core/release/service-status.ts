import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith } from 'rxjs';
import { Health, ServiceState } from './release';

/** Asks the API once per visit whether it is running, and which release it is (footer). */
@Injectable({ providedIn: 'root' })
export class ServiceStatus {
  private readonly http = inject(HttpClient);

  readonly status = toSignal(
    this.http.get<Health>('/api/health').pipe(
      map((health): ServiceState => ({ state: 'up', health })),
      catchError(() => of({ state: 'down' } as ServiceState)),
      startWith({ state: 'checking' } as ServiceState)),
    { initialValue: { state: 'checking' } as ServiceState });
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import {
  BatchRequest, BatchResult, OperationCatalogue, VerifyRequest, VerifyResult
} from './operations.models';

/**
 * The single gateway to the operation catalogue API. Pages never build URLs or
 * request bodies themselves, so the contract lives in one place.
 */
@Injectable({ providedIn: 'root' })
export class OperationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  /** Loaded once and shared by every page; after a failure the next subscriber tries again. */
  readonly catalogue$: Observable<OperationCatalogue> = this.http
    .get<OperationCatalogue>(`${this.baseUrl}/operations`)
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));

  verify(request: VerifyRequest): Observable<VerifyResult> {
    return this.http.post<VerifyResult>(`${this.baseUrl}/verify`, request);
  }

  runBatch(request: BatchRequest): Observable<BatchResult> {
    return this.http.post<BatchResult>(`${this.baseUrl}/batch`, request);
  }
}

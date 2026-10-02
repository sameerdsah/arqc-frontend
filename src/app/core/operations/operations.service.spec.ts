import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OperationsService } from './operations.service';
import { groupByNetwork, OperationInfo } from './operations.models';

describe('OperationsService', () => {
  let service: OperationsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(OperationsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the catalogue once and shares it', () => {
    let calls = 0;
    service.catalogue$.subscribe(() => calls++);
    service.catalogue$.subscribe(() => calls++);
    http.expectOne('/api/operations').flush({ operations: [], max_batch_items: 500 });
    expect(calls).toBe(2);
  });

  it('posts verification and batch requests to the API', () => {
    service.verify({ operation: 'visa/cvv2', input: { pan: '4111111111111111', expiry: '3012' }, received: '597' }).subscribe();
    const verify = http.expectOne('/api/verify');
    expect(verify.request.method).toBe('POST');
    expect(verify.request.body.operation).toBe('visa/cvv2');
    verify.flush({});

    service.runBatch({ operation: 'visa/cvv2', items: [] }).subscribe();
    expect(http.expectOne('/api/batch').request.method).toBe('POST');
  });

  it('groups operations by network in catalogue order', () => {
    const op = (id: string, network: string, label: string) =>
      ({ id, network, network_label: label } as OperationInfo);
    const groups = groupByNetwork([op('discover/cvv', 'discover', 'Discover'), op('visa/cvv2', 'visa', 'Visa'),
                                   op('discover/cid', 'discover', 'Discover')]);
    expect(groups.map(g => g.label)).toEqual(['Discover', 'Visa']);
    expect(groups[0].operations.map(o => o.id)).toEqual(['discover/cvv', 'discover/cid']);
  });
});

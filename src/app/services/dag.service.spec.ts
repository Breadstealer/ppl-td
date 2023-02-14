import { TestBed } from '@angular/core/testing';

import { DAGService } from './dag.service';

describe('DAGService', () => {
  let service: DAGService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DAGService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

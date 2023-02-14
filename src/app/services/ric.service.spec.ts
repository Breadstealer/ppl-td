import { TestBed } from '@angular/core/testing';

import { RICService } from './ric.service';

describe('RICServiceService', () => {
  let service: RICService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RICService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { Pdf } from './pdf.service';

describe('Pdf', () => {
  let service: Pdf;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pdf);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { DepthRendererService } from './depth-renderer.service';

describe('DepthRendererService', () => {
  let service: DepthRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DepthRendererService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { RenderProjectionService } from './render-projection.service';

describe('DepthRendererService', () => {
  let service: RenderProjectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RenderProjectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

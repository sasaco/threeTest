import { TestBed } from '@angular/core/testing';

import { ThreePanelService } from './three-panel.service';

describe('ThreePanelService', () => {
  let service: ThreePanelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThreePanelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

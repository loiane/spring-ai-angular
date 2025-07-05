import { TestBed } from '@angular/core/testing';

import { MemoryChat } from './memory-chat';

describe('MemoryChat', () => {
  let service: MemoryChat;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MemoryChat);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatList } from './chat-list';

describe('ChatList', () => {
  let component: ChatList;
  let fixture: ComponentFixture<ChatList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

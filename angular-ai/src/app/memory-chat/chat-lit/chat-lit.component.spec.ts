import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatLitComponent } from './chat-lit.component';

describe('ChatLitComponent', () => {
  let component: ChatLitComponent;
  let fixture: ComponentFixture<ChatLitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatLitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatLitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

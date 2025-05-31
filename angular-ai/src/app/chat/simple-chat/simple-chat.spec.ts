import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleChat } from './simple-chat';

describe('SimpleChat', () => {
  let component: SimpleChat;
  let fixture: ComponentFixture<SimpleChat>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleChat]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SimpleChat);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet, provideRouter } from '@angular/router';


describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        RouterOutlet,
        RouterLink
      ],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have the 'AI-Spring-Angular' title`, () => {
    expect(component.title).toEqual('AI-Spring-Angular');
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('span')?.textContent).toContain('AI-Spring-Angular');
  });

  it('should render the toolbar with buttons', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const toolbar = compiled.querySelector('mat-toolbar');
    expect(toolbar).toBeTruthy();

    const buttons = toolbar?.querySelectorAll('button');
    expect(buttons?.length).toBe(3);

    expect(buttons?.[0]?.textContent?.trim()).toBe('Simple Chat');
    expect(buttons?.[1]?.textContent?.trim()).toBe('Memory Chat');
  });
});

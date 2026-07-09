import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ConfirmDialog, ConfirmDialogData } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let component: ConfirmDialog;
  let fixture: ComponentFixture<ConfirmDialog>;
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  const data: ConfirmDialogData = {
    title: 'Delete document',
    message: 'Delete "test.pdf"? This cannot be undone.'
  };

  beforeEach(async () => {
    dialogRef = { close: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ConfirmDialog],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the provided title and message', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Delete document');
    expect(compiled.textContent).toContain('Delete "test.pdf"? This cannot be undone.');
  });

  it('should use default labels when none are provided', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Cancel');
    expect(compiled.textContent).toContain('Delete');
  });

  it('should use custom labels when provided', () => {
    fixture = TestBed.createComponent(ConfirmDialog);
    Object.assign(data, { confirmLabel: 'Remove', cancelLabel: 'Keep' });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Remove');
    expect(compiled.textContent).toContain('Keep');
  });

  it('should close with true when confirmed', () => {
    const confirmButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[color="warn"]');
    confirmButton.click();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close with false when cancelled', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const cancelButton: HTMLButtonElement = buttons[0];
    cancelButton.click();

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogHintComponent } from './dialog-hint.component';

describe('DialogHintComponent', () => {
  let component: DialogHintComponent;
  let fixture: ComponentFixture<DialogHintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DialogHintComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

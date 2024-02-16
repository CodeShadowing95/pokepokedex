import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCatchComponent } from './dialog-catch.component';

describe('DialogCatchComponent', () => {
  let component: DialogCatchComponent;
  let fixture: ComponentFixture<DialogCatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DialogCatchComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogCatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

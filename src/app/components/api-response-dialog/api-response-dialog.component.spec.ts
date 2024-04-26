import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiResponseDialogComponent } from './api-response-dialog.component';

describe('ApiResponseDialogComponent', () => {
  let component: ApiResponseDialogComponent;
  let fixture: ComponentFixture<ApiResponseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiResponseDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ApiResponseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

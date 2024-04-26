import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolarPotentialSectionComponent } from './solar-potential-section.component';

describe('SolarPotentialSectionComponent', () => {
  let component: SolarPotentialSectionComponent;
  let fixture: ComponentFixture<SolarPotentialSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolarPotentialSectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SolarPotentialSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

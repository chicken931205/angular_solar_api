import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuildingInsightsSectionComponent } from './building-insights-section.component';

describe('BuildingInsightsSectionComponent', () => {
  let component: BuildingInsightsSectionComponent;
  let fixture: ComponentFixture<BuildingInsightsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuildingInsightsSectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BuildingInsightsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

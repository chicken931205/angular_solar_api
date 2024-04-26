import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataLayersSectionComponent } from './data-layers-section.component';

describe('DataLayersSectionComponent', () => {
  let component: DataLayersSectionComponent;
  let fixture: ComponentFixture<DataLayersSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataLayersSectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DataLayersSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { BuildingInsightsResponse } from '../../solar';
import { findSolarConfig } from '../../utils';
import { BuildingInsightsSectionComponent } from '../building-insights-section/building-insights-section.component';
import { DataLayersSectionComponent } from '../data-layers-section/data-layers-section.component';
import { SolarPotentialSectionComponent } from '../solar-potential-section/solar-potential-section.component';
import { MaterialModule } from '../../../material-module';

@Component({
  selector: 'app-sections',
  standalone: true,
  imports: [
    BuildingInsightsSectionComponent,
    DataLayersSectionComponent,
    SolarPotentialSectionComponent,
    NgIf,
    MaterialModule,
  ],
  templateUrl: './sections.component.html',
  styleUrl: './sections.component.scss',
})
export class SectionsComponent implements OnInit, OnChanges {
  @Input() location!: google.maps.LatLng;
  @Input() map!: google.maps.Map;
  @Input() googleMapsApiKey!: string;

  _buildingInsights!: BuildingInsightsResponse;
  get buildingInsights(): BuildingInsightsResponse {
    return this._buildingInsights;
  }
  set buildingInsights(value: BuildingInsightsResponse) {
    if (this.buildingInsights == value) return;
    this._buildingInsights = value;
    this.getConfigID();
  }

  _configId!: number;
  get configId(): number {
    return this._configId;
  }
  set configId(value: number) {
    if (this._configId == value) return;
    this._configId = value;
    this.getConfigID();
  }

  expandedSection: string = '';
  showPanels = true;

  _monthlyAverageEnergyBillInput: number = 300;
  get monthlyAverageEnergyBillInput(): number {
    return this._monthlyAverageEnergyBillInput;
  }
  set monthlyAverageEnergyBillInput(value: number) {
    if (this._monthlyAverageEnergyBillInput == value) return;
    this._monthlyAverageEnergyBillInput = value;
    this.calculateYearlyKwhEnergyConsumption();
  }

  _panelCapacityWattsInput: number = 250;
  get panelCapacityWattsInput(): number {
    return this._panelCapacityWattsInput;
  }
  set panelCapacityWattsInput(value: number) {
    if (this._panelCapacityWattsInput == value) return;
    this._panelCapacityWattsInput = value;
    this.getConfigID();
  }

  _energyCostPerKwhInput: number = 0.31;
  get energyCostPerKwhInput(): number {
    return this._energyCostPerKwhInput;
  }
  set energyCostPerKwhInput(value: number) {
    if (this._energyCostPerKwhInput == value) return;
    this._energyCostPerKwhInput = value;
    this.calculateYearlyKwhEnergyConsumption();
  }

  _dcToAcDerateInput = 0.85;
  get dcToAcDerateInput(): number {
    return this._dcToAcDerateInput;
  }
  set dcToAcDerateInput(value: number) {
    if (this._dcToAcDerateInput == value) return;
    this._dcToAcDerateInput = value;
    this.getConfigID();
  }

  _yearlyKwhEnergyConsumption!: number;
  get yearlyKwhEnergyConsumption(): number {
    return this._yearlyKwhEnergyConsumption;
  }
  set yearlyKwhEnergyConsumption(value: number) {
    if (this._yearlyKwhEnergyConsumption == value) return;
    this._yearlyKwhEnergyConsumption = value;
    this.getConfigID();
  }

  constructor() {}
  ngOnInit(): void {
    this.calculateYearlyKwhEnergyConsumption();
  }
  ngOnChanges(changes: SimpleChanges): void {
    console.log(
      'Section Changes: ',
      changes,
      this.configId,
      this.buildingInsights
    );
  }
  calculateYearlyKwhEnergyConsumption(): void {
    this.yearlyKwhEnergyConsumption =
      (this.monthlyAverageEnergyBillInput / this.energyCostPerKwhInput) * 12;
  }
  getConfigID() {
    console.log(this.panelCapacityWattsInput);
    if (this.configId === undefined && this.buildingInsights) {
      console.log(this.panelCapacityWattsInput);
      const defaultPanelCapacity =
        this.buildingInsights.solarPotential.panelCapacityWatts;
      const panelCapacityRatio =
        this.panelCapacityWattsInput / defaultPanelCapacity;
      // Implement findSolarConfig logic here
      this.configId = findSolarConfig(
        this.buildingInsights.solarPotential.solarPanelConfigs,
        this.yearlyKwhEnergyConsumption,
        panelCapacityRatio,
        this.dcToAcDerateInput
      );
    }
  }
}

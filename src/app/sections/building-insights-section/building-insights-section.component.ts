import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { NgIf } from '@angular/common';

import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import {
  type BuildingInsightsResponse,
  findClosestBuilding,
  type RequestError,
  type SolarPanelConfig,
} from '../../solar';
import { createPalette, normalize, rgbToColor } from '../../visualize';
import { panelsPalette } from '../../colors';
import { showNumber } from '../../utils';
import { SummaryCardComponent } from '../../components/summary-card/summary-card.component';
import { GaugeComponent } from '../../components/gauge/gauge.component';
import { MaterialModule } from '../../../material-module';
import { MyFormsModule } from '../../../forms-module';
import { ApiResponseDialogComponent } from '../../components/api-response-dialog/api-response-dialog.component';

@Component({
  selector: 'app-building-insights-section', // Selector for the Angular component
  standalone: true,
  imports: [
    NgIf,
    SummaryCardComponent,
    GaugeComponent,
    MaterialModule,
    MyFormsModule,
  ],
  templateUrl: './building-insights-section.component.html', // Template URL
  styleUrls: ['./building-insights-section.component.scss'], // Styles URL
})
export class BuildingInsightsSectionComponent implements OnInit, OnChanges {
  @Input() googleMapsApiKey!: string;
  @Input() location!: google.maps.LatLng;
  @Input() map!: google.maps.Map;

  @Input() buildingInsights: BuildingInsightsResponse | undefined;
  @Output() buildingInsightsChange = new EventEmitter<
    BuildingInsightsResponse | undefined
  >();

  @Input() configId!: number;
  @Output() configIdChange = new EventEmitter<number | undefined>();

  @Input() panelCapacityWatts!: number;
  @Output() panelCapacityWattsChange = new EventEmitter<number>();

  @Input() showPanels!: boolean;
  @Output() showPanelsChange = new EventEmitter<boolean>();

  requestSent = false;
  requestError: RequestError | undefined;
  apiResponseDialog!: MatDialog;
  expanded: boolean = false;
  title: string = 'Building Insights endpoint';
  icon: string = 'home';
  panelsCountInput: FormControl = new FormControl(0);
  showPanelsToggle: boolean = true;

  constructor(public dialog: MatDialog) {}

  _panelConfig: SolarPanelConfig | undefined;

  get panelConfig(): SolarPanelConfig | undefined {
    return this._panelConfig;
  }

  set panelConfig(value: SolarPanelConfig | undefined) {
    if (this._panelConfig == value) return;
    this._panelConfig = value;
    this.setPanelsMap();
  }

  _solarPanels: google.maps.Polygon[] = [];

  get solarPanels(): google.maps.Polygon[] {
    return this._solarPanels;
  }

  set solarPanels(value: google.maps.Polygon[]) {
    this._solarPanels = value;
    this.setPanelsMap();
  }

  get yearEnergyMax(): number {
    return (
      (this.buildingInsights?.solarPotential.solarPanelConfigs.slice(-1)[0]
        .yearlyEnergyDcKwh ?? 0) * this.panelCapacityRatio
    );
  }

  _panelCapacityRatio = 1.0;

  get panelCapacityRatio(): number {
    if (this.buildingInsights) {
      const defaultPanelCapacity =
        this.buildingInsights.solarPotential.panelCapacityWatts;
      this._panelCapacityRatio = this.panelCapacityWatts / defaultPanelCapacity;
      return this._panelCapacityRatio;
    }
    return this._panelCapacityRatio;
  }

  get yearlyEnerge(): string {
    if (this.panelConfig == undefined) return '';
    return `Yearly energy: ${(
      (this.panelConfig?.yearlyEnergyDcKwh * this.panelCapacityRatio) /
      1000
    ).toFixed(2)} MWh`;
  }

  get panelsMaxCount(): number {
    if (this.buildingInsights == undefined) return 0;
    return this.buildingInsights?.solarPotential.solarPanelConfigs.length - 1;
  }

  _summaryCardRows: any[] = [];

  get summaryCardRows(): any[] {
    return this._summaryCardRows;
  }

  set summaryCardRows(value: any[]) {
    this._summaryCardRows = value;
  }

  showNumber = (value: number) => showNumber(value);

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['configId'] && changes['configId'].currentValue) ||
      (changes['buildingInsights'] && changes['buildingInsights'].currentValue)
    ) {
      this.panelsCountInput.setValue(this.configId);
      if (this.buildingInsights && this.configId !== undefined) {
        this.panelConfig =
          this.buildingInsights.solarPotential.solarPanelConfigs[this.configId];
      }
      if (this.buildingInsights) {
        this.summaryCardRows = [
          {
            icon: 'wb_sunny',
            name: 'Annual sunshine',
            value: showNumber(
              this.buildingInsights.solarPotential.maxSunshineHoursPerYear
            ),
            units: 'hr',
          },
          {
            icon: 'square_foot',
            name: 'Roof area',
            value: showNumber(
              this.buildingInsights.solarPotential.wholeRoofStats.areaMeters2
            ),
            units: 'm²',
          },
          {
            icon: 'solar_power',
            name: 'Max panel count',
            value: showNumber(
              this.buildingInsights.solarPotential.solarPanels.length
            ),
            units: 'panels',
          },
          {
            icon: 'co2',
            name: 'CO₂ savings',
            value: showNumber(
              this.buildingInsights.solarPotential.carbonOffsetFactorKgPerMwh
            ),
            units: 'Kg/MWh',
          },
        ];
      }
    }
    if (changes['location'] && changes['location'].currentValue) {
      this.showSolarPotential(this.location);
    }

    if (
      changes['showPanels'] !== undefined &&
      changes['showPanels'].currentValue !== undefined
    ) {
      this.setPanelsMap();
    }

    // if (this.buildingInsights && this.configId !== undefined) {
    //   this.panelConfig =
    //     this.buildingInsights.solarPotential.solarPanelConfigs[this.configId];
    //   console.log(this.panelConfig);
    // }
  }

  ngOnInit(): void {
    this.showSolarPotential(this.location);
  }

  setPanelsMap() {
    this.solarPanels.map((panel, i) =>
      panel.setMap(
        this.showPanels && this.panelConfig && i < this.panelConfig.panelsCount
          ? this.map
          : null
      )
    );
  }

  async showSolarPotential(location: google.maps.LatLng) {
    if (this.requestSent) {
      return;
    }

    console.log('showSolarPotential');
    this.buildingInsights = undefined;
    this.buildingInsightsChange.emit(this.buildingInsights);

    this.requestError = undefined;

    this.solarPanels.forEach((panel) => panel.setMap(null));
    this.solarPanels = [];

    this.requestSent = true;
    try {
      this.buildingInsights = await findClosestBuilding(
        location,
        this.googleMapsApiKey
      );
      this.buildingInsightsChange.emit(this.buildingInsights);
    } catch (e) {
      this.requestError = e as RequestError;
      return;
    } finally {
      this.requestSent = false;
    }

    // Create the solar panels on the map.
    const solarPotential = this.buildingInsights.solarPotential;
    const palette = createPalette(panelsPalette).map(rgbToColor);
    const minEnergy = solarPotential.solarPanels.slice(-1)[0].yearlyEnergyDcKwh;
    const maxEnergy = solarPotential.solarPanels[0].yearlyEnergyDcKwh;
    this.solarPanels = solarPotential.solarPanels.map((panel) => {
      const [w, h] = [
        solarPotential.panelWidthMeters / 2,
        solarPotential.panelHeightMeters / 2,
      ];
      const points = [
        { x: +w, y: +h }, // top right
        { x: +w, y: -h }, // bottom right
        { x: -w, y: -h }, // bottom left
        { x: -w, y: +h }, // top left
        { x: +w, y: +h }, // top right
      ];
      const orientation = panel.orientation == 'PORTRAIT' ? 90 : 0;
      const azimuth =
        solarPotential.roofSegmentStats[panel.segmentIndex].azimuthDegrees;
      const colorIndex = Math.round(
        normalize(panel.yearlyEnergyDcKwh, maxEnergy, minEnergy) * 255
      );
      var addListenersOnPolygon = function(polygon) {
        google.maps.event.addListener(polygon, 'click', function (event) {
          console.log('here ',polygon);
          if(polygon.metadata.isActive) {
            polygon.metadata.isActive = false;
            polygon.setOptions({strokeWeight: 2.0, fillColor: 'red'});
          }else{
            polygon.metadata.isActive = true;
            polygon.setOptions({strokeWeight: 2.0, fillColor: 'green'});

          }

        });
      }

      const polygon = new google.maps.Polygon({
        paths: points.map(({ x, y }) =>
          google.maps.geometry.spherical.computeOffset(
            { lat: panel.center.latitude, lng: panel.center.longitude },
            Math.sqrt(x * x + y * y),
            Math.atan2(y, x) * (180 / Math.PI) + orientation + azimuth
          )
        ),
        strokeColor: 'black',
        strokeOpacity: 0.9,
        strokeWeight: 1,
        fillColor: "red",
        fillOpacity: 0.9,
      });
      polygon["metadata"] = {
        isActive: false,
      };

      addListenersOnPolygon(polygon);

      return polygon;
    });
  }

  openDialog() {
    const dialogRef = this.dialog.open(ApiResponseDialogComponent, {
      data: {
        icon: this.icon,
        title: this.title,
        buildingInsights: this.buildingInsights,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed', result);
    });
  }

  onSliderChange() {
    this.configId = this.panelsCountInput.value;
    this.configIdChange.emit(this.configId);
  }

  onShowPanelsChange() {
    this.showPanels = this.showPanelsToggle;
    this.showPanelsChange.emit(this.showPanels);
  }

  onPanelCapacityChange(event: any) {
    this.panelCapacityWatts = event.target.value;
    this.panelCapacityWattsChange.emit(this.panelCapacityWatts);
  }
}

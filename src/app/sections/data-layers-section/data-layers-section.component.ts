import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  Output,
  EventEmitter,
} from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormControl } from '@angular/forms';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';

import { MatDialog } from '@angular/material/dialog';
import {
  type BuildingInsightsResponse,
  type DataLayersResponse,
  type LayerId,
  type RequestError,
  getDataLayerUrls,
} from '../../solar';
import { getLayer, type Layer } from '../../layer';
import { SummaryCardComponent } from '../../components/summary-card/summary-card.component';
import moment from 'moment';
import { MaterialModule } from '../../../material-module';
import { MyFormsModule } from '../../../forms-module';
import { ApiResponseDialogComponent } from '../../components/api-response-dialog/api-response-dialog.component';

export const MY_FORMATS = {
  parse: {
    dateInput: 'MMMM DD',
  },
  display: {
    dateInput: 'MMMM DD',
    monthYearLabel: 'MMMM DD',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM DD',
  },
};

@Component({
  selector: 'app-data-layers-section',
  standalone: true,
  imports: [MaterialModule, MyFormsModule, NgIf, NgFor, SummaryCardComponent],
  providers: [provideMomentDateAdapter(MY_FORMATS)],
  templateUrl: './data-layers-section.component.html',
  styleUrl: './data-layers-section.component.scss',
})
export class DataLayersSectionComponent implements OnInit, OnChanges {
  @Input() showPanels!: boolean;
  @Output() showPanelsChange = new EventEmitter<boolean>();

  @Input() googleMapsApiKey!: string;
  @Input() buildingInsights!: BuildingInsightsResponse;
  // @Input() geometryLibrary!: google.maps.GeometryLibrary;
  @Input() map!: google.maps.Map;

  icon: string = 'layers';
  title: string = 'Data Layers endpoint';

  dataLayerOptions: Record<LayerId | 'none', string> = {
    none: 'No layer',
    mask: 'Roof mask',
    dsm: 'Digital Surface Model',
    rgb: 'Aerial image',
    annualFlux: 'Annual sunshine',
    monthlyFlux: 'Monthly sunshine',
    hourlyShade: 'Hourly shade',
  };

  monthNames: string[] = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  dataLayersResponse: DataLayersResponse | undefined;
  requestError: RequestError | undefined;

  @ViewChild('apiResponseDialog') apiResponseDialog!: MatDialog;

  layerId: LayerId | 'none' = 'monthlyFlux';

  _layer: Layer | undefined;
  get layer(): Layer | undefined {
    return this._layer;
  }
  set layer(value: Layer | undefined) {
    this._layer = value;
    if (this._layer?.id == 'monthlyFlux') {
      this.overlays.map((overlay, i) =>
        overlay.setMap(i == this.month ? this.map : null)
      );
    } else if (this._layer?.id == 'hourlyShade') {
      this.overlays.map((overlay, i) =>
        overlay.setMap(i == this.hour ? this.map : null)
      );
    }

    if (this.layer?.id == 'monthlyFlux') {
      if (this.playAnimation) {
        this.month = this.tick % 12;
      } else {
        this.tick = this.month;
      }
    } else if (this.layer?.id == 'hourlyShade') {
      if (this.playAnimation) {
        this.hour = this.tick % 24;
      } else {
        this.tick = this.hour;
      }
    }
    if (this.layer && this.layer['palette']) {
      console.log(this.layer);
      this.renderPalette = this.layer.palette.colors.map((hex) => '#' + hex);
    }
  }

  _imageryQuality!: 'HIGH' | 'MEDIUM' | 'LOW';
  get imageryQuality(): 'HIGH' | 'MEDIUM' | 'LOW' {
    return this._imageryQuality;
  }
  set imageryQuality(value) {
    if (value == this._imageryQuality) return;
    this._imageryQuality = value;
  }

  playAnimation: boolean = true;

  _tick: number = 0;
  get tick(): number {
    return this._tick;
  }
  set tick(value: number) {
    if (this._tick == value) return;
    this._tick = value;
    this.invalidate();
    this.invalidateOverlays();
  }
  _month: number = 0;
  get month(): number {
    return this._month;
  }
  set month(value: number) {
    if (this._month == value) return;
    this._month = value;
    this.invalidateOverlays();
  }
  _day: number = 14;
  get day(): number {
    return this._day;
  }
  set day(value: number) {
    if (this._day == value) return;
    this._day = value;
    this.invalidateOverlays();
  }
  _hour: number = 0;
  get hour(): number {
    return this._hour;
  }
  set hour(value: number) {
    if (this._hour == value) return;
    this._hour = value;
    this.tick = this._hour;
    this.invalidateOverlays();
  }

  _overlays: google.maps.GroundOverlay[] = [];
  get overlays(): google.maps.GroundOverlay[] {
    return this._overlays;
  }
  set overlays(value: google.maps.GroundOverlay[]) {
    this._overlays = value;
    this.invalidateOverlays();
  }

  _showRoofOnly: boolean = false;
  get showRoofOnly(): boolean {
    return this._showRoofOnly;
  }
  set showRoofOnly(value: boolean) {
    if (this._showRoofOnly == value) return;
    this._showRoofOnly = value;
    this.showDataLayer();
  }

  _isHourMonthly: boolean = false;
  get isHourMonthly(): boolean {
    return this._isHourMonthly;
  }
  set isHourMonthly(value: boolean) {
    if (this._isHourMonthly == value) return;
    this._isHourMonthly = value;
  }

  _summaryCardRows: any[] = [];
  get summaryCardRows(): any[] {
    return this._summaryCardRows;
  }
  set summaryCardRows(value: any[]) {
    this._summaryCardRows = value;
  }

  _renderPalette: string[] = [];
  get renderPalette(): string[] {
    return this._renderPalette;
  }
  set renderPalette(value: string[]) {
    if (this._renderPalette == value) return;
    this._renderPalette = value;
  }

  dataLayerOptionKeys: string[] = Object.values(this.dataLayerOptions);
  dataLayerOptionValues: string[] = Object.keys(this.dataLayerOptions);

  expanded: boolean = false;

  // Form Controls
  solarPanelsToggle = new FormControl(true);
  roofOnlyToggle = new FormControl(true);
  playAnimationToggle = new FormControl(true);
  datePicker = new FormControl(moment());

  constructor(public dialog: MatDialog) {}

  ngOnInit(): void {
    //this.showDataLayer(true);

    setInterval(() => {
      this.tick++;
      if (this.layer?.id == 'monthlyFlux') {
        if (this.playAnimation) {
          this.month = this.tick % 12;
        } else {
          this.tick = this.month;
        }
      } else if (this.layer?.id == 'hourlyShade') {
        if (this.playAnimation) {
          this.hour = this.tick % 24;
        } else {
          this.tick = this.hour;
        }
      }
    }, 1000);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['map'] && changes['map'].currentValue) ||
      (changes['buildingInsights'] && changes['buildingInsights'].currentValue)
    ) {
      console.log(changes['buildingInsights']);
      if (this.map && this.buildingInsights) this.showDataLayer(true);
    }
  }

  openDialog() {
    const dialogRef = this.dialog.open(ApiResponseDialogComponent, {
      data: {
        icon: this.icon,
        title: this.title,
        buildingInsights: this.dataLayersResponse,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed', result);
    });
  }

  invalidate() {
    if (this.layer?.id == 'monthlyFlux') {
      if (this.playAnimation) {
        this.month = this.tick % 12;
      } else {
        this.tick = this.month;
      }
    } else if (this.layer?.id == 'hourlyShade') {
      if (this.playAnimation) {
        this.hour = this.tick % 24;
      } else {
        this.tick = this.hour;
      }
    }
  }

  invalidateOverlays() {
    if (this._layer?.id == 'monthlyFlux') {
      this.overlays.map((overlay, i) =>
        overlay.setMap(i == this.month ? this.map : null)
      );
    } else if (this._layer?.id == 'hourlyShade') {
      this.overlays.map((overlay, i) =>
        overlay.setMap(i == this.hour ? this.map : null)
      );
    }
  }

  async showDataLayer(reset = false) {
    if (reset) {
      this.dataLayersResponse = undefined;
      this.requestError = undefined;
      this.layer = undefined;

      // Default values per layer.
      this.showRoofOnly = ['annualFlux', 'monthlyFlux', 'hourlyShade'].includes(
        this.layerId
      );
      this.map.setMapTypeId(this.layerId == 'rgb' ? 'roadmap' : 'satellite');
      this.overlays.map((overlay) => overlay.setMap(null));
      this.month = this.layerId == 'hourlyShade' ? 3 : 0;
      this.day = 14;
      this.hour = 5;
      this.playAnimation = ['monthlyFlux', 'hourlyShade'].includes(
        this.layerId
      );
    }
    if (this.layerId == 'none') {
      return;
    }

    if (!this.layer) {
      const center = this.buildingInsights.center;
      const ne = this.buildingInsights.boundingBox.ne;
      const sw = this.buildingInsights.boundingBox.sw;
      const diameter = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(ne.latitude, ne.longitude),
        new google.maps.LatLng(sw.latitude, sw.longitude)
      );
      const radius = Math.ceil(diameter / 2);
      try {
        this.dataLayersResponse = await getDataLayerUrls(
          center,
          radius,
          this.googleMapsApiKey
        );
      } catch (e) {
        this.requestError = e as RequestError;
        return;
      }

      this.imageryQuality = this.dataLayersResponse.imageryQuality;
      console.log(this.imageryQuality);

      try {
        this.layer = await getLayer(
          this.layerId,
          this.dataLayersResponse,
          this.googleMapsApiKey
        );
      } catch (e) {
        this.requestError = e as RequestError;
        return;
      }
    }

    const bounds = this.layer.bounds;
    console.log('Render layer:', {
      layerId: this.layer.id,
      showRoofOnly: this.showRoofOnly,
      month: this.month,
      day: this.day,
    });
    this.overlays.map((overlay) => overlay.setMap(null));
    this.overlays = this.layer
      .render(this.showRoofOnly, this.month, this.day)
      .map(
        (canvas) => new google.maps.GroundOverlay(canvas.toDataURL(), bounds)
      );

    if (!['monthlyFlux', 'hourlyShade'].includes(this.layer.id)) {
      this.overlays[0].setMap(this.map);
    }
  }

  onSliderChange(value: number): void {
    if (this.layer?.id == 'monthlyFlux') {
      if (value != this.month) {
        this.tick = value;
      }
    } else if (this.layer?.id == 'hourlyShade') {
      if (value != this.hour) {
        this.tick = value ?? 0;
      }
      this.tick = this.hour;
    }
  }

  onSelectionChange() {
    console.log(this.layerId);
    this.summaryCardRows = [
      { name: this.dataLayerOptions[this.layerId], value: '' },
    ];
    this.layer = undefined;
    this.showDataLayer();
  }

  onSolarPanelsChange() {
    console.log(this.solarPanelsToggle.value);
    this.showPanels = this.solarPanelsToggle.value ?? true;
    this.showPanelsChange.emit(this.showPanels);
  }
  onRoofOnlyChange() {
    this.showRoofOnly = this.roofOnlyToggle.value ?? true;
  }
  onPlayAnimationChange() {
    this.playAnimation = this.playAnimationToggle.value ?? true;
  }
  setMonthAndDay(type: string, event: any) {
    let selDate = this.datePicker.value.toLocaleString();
    selDate = new Date(selDate).toLocaleDateString();
    this.day = parseInt(selDate.split('/')[1]);
    this.month = parseInt(selDate.split('/')[0]) + 1;
    console.log(this.day, this.month);
    this.showDataLayer();
  }
}

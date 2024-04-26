import {
  Component,
  Input,
  Output,
  OnChanges,
  OnInit,
  EventEmitter,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  AfterViewInit,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { SolarPanelConfig } from '../../solar';
import { findSolarConfig, showMoney, showNumber } from '../../utils';
import { MaterialModule } from '../../../material-module';
import { MyFormsModule } from '../../../forms-module';
import { SummaryCardComponent } from '../../components/summary-card/summary-card.component';
import { TableComponent } from '../../components/table/table.component';
import { GoogleCharts } from 'google-charts';

@Component({
  selector: 'app-solar-potential-section',
  standalone: true,
  imports: [
    MyFormsModule,
    NgIf,
    MaterialModule,
    SummaryCardComponent,
    TableComponent,
  ],
  providers: [],
  templateUrl: './solar-potential-section.component.html',
  styleUrl: './solar-potential-section.component.scss',
})
export class SolarPotentialSectionComponent
  implements OnInit, OnChanges, AfterViewChecked, AfterViewInit
{
  @Input() configId!: number;
  @Output() configIdChange = new EventEmitter<number>();

  @Input() monthlyAverageEnergyBillInput!: number;
  @Output() monthlyAverageEnergyBillInputChange = new EventEmitter<number>();

  @Input() energyCostPerKwhInput!: number;
  @Output() energyCostPerKwhInputChange = new EventEmitter<number>();

  @Input() panelCapacityWattsInput!: number;
  @Output() panelCapacityWattsInputChange = new EventEmitter<number>();

  @Input() dcToAcDerateInput!: number;
  @Output() dcToAcDerateInputChange = new EventEmitter<number>();

  @Input() solarPanelConfigs!: SolarPanelConfig[];

  @Input() defaultPanelCapacityWatts!: number;

  icon = 'payments';
  title = 'Solar Potential analysis';

  expanded: boolean = false;

  @ViewChild('costChart') costChart!: ElementRef;
  showAdvancedSettings: boolean = false;

  // [START solar_potential_calculations]
  // Solar configuration, from buildingInsights.solarPotential.solarPanelConfigs
  panelsCount: number = 20;
  yearlyEnergyDcKwh: number = 12000;

  // Basic settings
  monthlyAverageEnergyBill: number = 300;
  energyCostPerKwh = 0.31;
  panelCapacityWatts = 400;
  solarIncentives: number = 7000;
  _installationCostPerWatt: number = 4.0;
  get installationCostPerWatt(): number {
    return this._installationCostPerWatt;
  }
  set installationCostPerWatt(value: number) {
    if (this._installationCostPerWatt == value) return;
    this._installationCostPerWatt = value;
    this.resetInstallationCostTotal();
  }
  installationLifeSpan: number = 20;

  get panelsMaxCount(): number {
    if (this.solarPanelConfigs == undefined) return 0;
    return this.solarPanelConfigs.length - 1;
  }

  // Advanced settings
  dcToAcDerate = 0.85;
  efficiencyDepreciationFactor = 0.995;
  costIncreaseFactor = 1.022;
  discountRate = 1.04;

  // Solar installation
  installationSizeKw: number =
    (this.panelsCount * this.panelCapacityWatts) / 1000;
  installationCostTotal: number =
    this.installationCostPerWatt * this.installationSizeKw * 1000;

  // Energy consumption
  monthlyKwhEnergyConsumption: number =
    this.monthlyAverageEnergyBill / this.energyCostPerKwh;
  yearlyKwhEnergyConsumption: number = this.monthlyKwhEnergyConsumption * 12;

  // Energy produced for installation life span
  initialAcKwhPerYear: number = this.yearlyEnergyDcKwh * this.dcToAcDerate;
  yearlyProductionAcKwh: number[] = [
    ...Array(this.installationLifeSpan).keys(),
  ].map(
    (year) =>
      this.initialAcKwhPerYear * this.efficiencyDepreciationFactor ** year
  );

  // Cost with solar for installation life span
  yearlyUtilityBillEstimates: number[] = this.yearlyProductionAcKwh.map(
    (yearlyKwhEnergyProduced, year) => {
      const billEnergyKwh =
        this.yearlyKwhEnergyConsumption - yearlyKwhEnergyProduced;
      const billEstimate =
        (billEnergyKwh *
          this.energyCostPerKwh *
          this.costIncreaseFactor ** year) /
        this.discountRate ** year;
      return Math.max(billEstimate, 0); // bill cannot be negative
    }
  );
  remainingLifetimeUtilityBill: number = this.yearlyUtilityBillEstimates.reduce(
    (x, y) => x + y,
    0
  );
  totalCostWithSolar: number =
    this.installationCostTotal +
    this.remainingLifetimeUtilityBill -
    this.solarIncentives;
  //console.log(`Cost with solar: $${this.totalCostWithSolar.toFixed(2)}`);

  // Cost without solar for installation life span
  yearlyCostWithoutSolar: number[] = [
    ...Array(this.installationLifeSpan).keys(),
  ].map(
    (year) =>
      (this.monthlyAverageEnergyBill * 12 * this.costIncreaseFactor ** year) /
      this.discountRate ** year
  );
  totalCostWithoutSolar: number = this.yearlyCostWithoutSolar.reduce(
    (x, y) => x + y,
    0
  );

  // Savings with solar for installation life span
  savings: number = this.totalCostWithoutSolar - this.totalCostWithSolar;
  // [END solar_potential_calculations]

  // Reactive calculations
  panelCapacityRatio: number =
    this.panelCapacityWattsInput / this.defaultPanelCapacityWatts;

  energyCovered: number =
    this.yearlyProductionAcKwh[0] / this.yearlyKwhEnergyConsumption;
  breakEvenYear: number = -1;

  get summaryCardRows(): any[] {
    return [
      {
        icon: 'energy_savings_leaf',
        name: 'Yearly energy',
        value: showNumber(
          (this.solarPanelConfigs[this.configId]?.yearlyEnergyDcKwh ?? 0) *
            this.panelCapacityRatio
        ),
        units: 'kWh',
      },
      {
        icon: 'speed',
        name: 'Installation size',
        value: showNumber(this.installationSizeKw),
        units: 'kW',
      },
      {
        icon: 'request_quote',
        name: 'Installation cost',
        value: showMoney(this.installationCostTotal),
      },
      {
        icon: [
          'battery_0_bar',
          'battery_1_bar',
          'battery_2_bar',
          'battery_3_bar',
          'battery_4_bar',
          'battery_5_bar',
          'battery_full',
        ][
          Math.floor(
            Math.min(Math.round(this.energyCovered * 100) / 100, 1) * 6
          )
        ],
        name: 'Energy covered',
        value: Math.round(this.energyCovered * 100).toString(),
        units: '%',
      },
    ];
  }
  tableRows: any[] = [
    {
      icon: 'wallet',
      name: 'Cost without solar',
      value: showMoney(this.totalCostWithoutSolar),
    },
    {
      icon: 'wb_sunny',
      name: 'Cost with solar',
      value: showMoney(this.totalCostWithSolar),
    },
    {
      icon: 'savings',
      name: 'Savings',
      value: showMoney(this.savings),
    },
    {
      icon: 'balance',
      name: 'Break even',
      value:
        this.breakEvenYear >= 0
          ? `${this.breakEvenYear + new Date().getFullYear() + 1} in ${
              this.breakEvenYear + 1
            }`
          : '--',
      units: 'years',
    },
  ];

  constructor() {}

  ngOnInit(): void {
    console.log(`Cost with solar: $${this.totalCostWithSolar.toFixed(2)}`);
    console.log(
      `Cost without solar: $${this.totalCostWithoutSolar.toFixed(2)}`
    );
    console.log(
      `Savings: $${this.savings.toFixed(2)} in ${
        this.installationLifeSpan
      } years`
    );
    setInterval(() => this.drawChart(), 1000);
  }

  ngAfterViewChecked(): void {}
  ngAfterViewInit(): void {}

  drawChart() {
    GoogleCharts.load(
      () => {
        if (!this.costChart) {
          return;
        }
        const year = new Date().getFullYear();

        let costWithSolar = 0;
        const cumulativeCostsWithSolar = this.yearlyUtilityBillEstimates.map(
          (billEstimate, i) =>
            (costWithSolar +=
              i == 0
                ? billEstimate +
                  this.installationCostTotal -
                  this.solarIncentives
                : billEstimate)
        );
        let costWithoutSolar = 0;
        const cumulativeCostsWithoutSolar = this.yearlyCostWithoutSolar.map(
          (cost) => (costWithoutSolar += cost)
        );
        this.breakEvenYear = cumulativeCostsWithSolar.findIndex(
          (costWithSolar, i) => costWithSolar <= cumulativeCostsWithoutSolar[i]
        );

        const data = google.visualization.arrayToDataTable([
          ['Year', 'Solar', 'No solar'],
          [year.toString(), 0, 0],
          ...cumulativeCostsWithSolar.map((_, i) => [
            (year + i + 1).toString(),
            cumulativeCostsWithSolar[i],
            cumulativeCostsWithoutSolar[i],
          ]),
        ]);

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const googleCharts = google.charts as any;
        const chart = new googleCharts.Line(this.costChart.nativeElement);
        const options = googleCharts.Line.convertOptions({
          title: `Cost analysis for ${this.installationLifeSpan} years`,
          width: 350,
          height: 200,
        });
        chart.draw(data, options);
      },
      { packages: ['line'] }
    );
  }

  /*
  drawChart() {
    const year = new Date().getFullYear();

    let costWithSolar = 0;
    const cumulativeCostsWithSolar = this.yearlyUtilityBillEstimates.map(
      (billEstimate, i) =>
        (costWithSolar +=
          i == 0
            ? billEstimate + this.installationCostTotal - this.solarIncentives
            : billEstimate)
    );
    let costWithoutSolar = 0;
    const cumulativeCostsWithoutSolar = this.yearlyCostWithoutSolar.map(
      (cost) => (costWithoutSolar += cost)
    );
    this.breakEvenYear = cumulativeCostsWithSolar.findIndex(
      (costWithSolar, i) => costWithSolar <= cumulativeCostsWithoutSolar[i]
    );

    const data = google.visualization.arrayToDataTable([
      ['Year', 'Solar', 'No solar'],
      [year.toString(), 0, 0],
      ...cumulativeCostsWithSolar.map((_, i) => [
        (year + i + 1).toString(),
        cumulativeCostsWithSolar[i],
        cumulativeCostsWithoutSolar[i],
      ]),
    ]);

    const googleCharts = google.charts as any;
    const chart = new googleCharts.Line(this.costChart.nativeElement);
    const options = googleCharts.Line.convertOptions({
      title: `Cost analysis for ${this.installationLifeSpan} years`,
      width: 350,
      height: 200,
    });
    chart.draw(data, options);
  }
  */

  updateConfig() {
    // Reactive Calculations
    this.panelCapacityRatio =
      this.panelCapacityWattsInput / this.defaultPanelCapacityWatts;
    this.installationCostTotal =
      this.installationCostPerWatt * this.installationSizeKw * 1000;
    if (this.solarPanelConfigs[this.configId]) {
      this.installationSizeKw =
        (this.solarPanelConfigs[this.configId].panelsCount *
          this.panelCapacityWattsInput) /
        1000;
      this.initialAcKwhPerYear =
        this.solarPanelConfigs[this.configId].yearlyEnergyDcKwh *
        this.panelCapacityRatio *
        this.dcToAcDerateInput;
    }
    this.monthlyKwhEnergyConsumption =
      this.monthlyAverageEnergyBillInput / this.energyCostPerKwhInput;
    this.yearlyKwhEnergyConsumption = this.monthlyKwhEnergyConsumption * 12;
    this.yearlyProductionAcKwh = [
      ...Array(this.installationLifeSpan).keys(),
    ].map(
      (year) =>
        this.initialAcKwhPerYear * this.efficiencyDepreciationFactor ** year
    );
    this.yearlyUtilityBillEstimates = this.yearlyProductionAcKwh.map(
      (yearlyKwhEnergyProduced, year) => {
        const billEnergyKwh =
          this.yearlyKwhEnergyConsumption - yearlyKwhEnergyProduced;
        const billEstimate =
          (billEnergyKwh *
            this.energyCostPerKwhInput *
            this.costIncreaseFactor ** year) /
          this.discountRate ** year;
        return Math.max(billEstimate, 0); // bill cannot be negative
      }
    );
    this.remainingLifetimeUtilityBill = this.yearlyUtilityBillEstimates.reduce(
      (x, y) => x + y,
      0
    );
    this.totalCostWithSolar =
      this.installationCostTotal +
      this.remainingLifetimeUtilityBill -
      this.solarIncentives;
    this.yearlyCostWithoutSolar = [
      ...Array(this.installationLifeSpan).keys(),
    ].map(
      (year) =>
        (this.monthlyAverageEnergyBillInput *
          12 *
          this.costIncreaseFactor ** year) /
        this.discountRate ** year
    );
    this.totalCostWithoutSolar = this.yearlyCostWithoutSolar.reduce(
      (x, y) => x + y,
      0
    );
    this.savings = this.totalCostWithoutSolar - this.totalCostWithSolar;
    this.energyCovered =
      this.yearlyProductionAcKwh[0] / this.yearlyKwhEnergyConsumption;

    this.monthlyKwhEnergyConsumption =
      this.monthlyAverageEnergyBillInput / this.energyCostPerKwhInput;
    this.yearlyKwhEnergyConsumption = this.monthlyKwhEnergyConsumption * 12;
    this.panelCapacityRatio =
      this.panelCapacityWattsInput / this.defaultPanelCapacityWatts;
    this.configId = findSolarConfig(
      this.solarPanelConfigs,
      this.yearlyKwhEnergyConsumption,
      this.panelCapacityRatio,
      this.dcToAcDerateInput
    );

    this.configIdChange.emit(this.configId);
    this.panelCapacityWattsInputChange.emit(this.panelCapacityWattsInput);
    this.dcToAcDerateInputChange.emit(this.dcToAcDerateInput);
    this.energyCostPerKwhInputChange.emit(this.energyCostPerKwhInput);
    this.monthlyAverageEnergyBillInputChange.emit(
      this.monthlyAverageEnergyBillInput
    );

    this.tableRows = [
      {
        icon: 'wallet',
        name: 'Cost without solar',
        value: showMoney(this.totalCostWithoutSolar),
      },
      {
        icon: 'wb_sunny',
        name: 'Cost with solar',
        value: showMoney(this.totalCostWithSolar),
      },
      {
        icon: 'savings',
        name: 'Savings',
        value: showMoney(this.savings),
      },
      {
        icon: 'balance',
        name: 'Break even',
        value:
          this.breakEvenYear >= 0
            ? `${this.breakEvenYear + new Date().getFullYear() + 1} in ${
                this.breakEvenYear + 1
              }`
            : '--',
        units: 'years',
      },
    ];

    this.drawChart();
  }

  resetInstallationCostTotal() {
    this.installationCostTotal =
      this.installationCostPerWatt * this.installationSizeKw * 1000;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['defaultPanelCapacityWatts'] &&
      changes['defaultPanelCapacityWatts'].currentValue &&
      changes['panelCapacityWattsInput'] &&
      changes['panelCapacityWattsInput'].currentValue
    ) {
      this.panelCapacityRatio =
        this.panelCapacityWattsInput / this.defaultPanelCapacityWatts;
    }
    if (
      (changes['configId'] && changes['configId'].currentValue) ||
      (changes['solarPanelConfigs'] &&
        changes['solarPanelConfigs'].currentValue)
    ) {
    }
  }

  onSliderChange() {
    console.log('He', this.configId);
    this.configIdChange.emit(this.configId);
    this.drawChart();
  }
}

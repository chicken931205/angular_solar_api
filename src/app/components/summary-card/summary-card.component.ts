import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TableComponent } from '../table/table.component';
import { MatDividerModule } from '@angular/material/divider';
@Component({
  selector: 'app-summary-card',
  standalone: true,
  imports: [TableComponent, MatDividerModule],
  templateUrl: './summary-card.component.html',
  styleUrl: './summary-card.component.scss',
})
export class SummaryCardComponent implements OnChanges {
  @Input() rows: {
    name: string;
    value: string;
    units?: string;
    icon?: string;
  }[] = [];
  @Input() title: string = '';
  @Input() icon: string = '';
  ngOnChanges(changes: SimpleChanges): void {
    //    console.log('SummaryCard OnChanges: ', changes['rows'].currentValue);
  }
}

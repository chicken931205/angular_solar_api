import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgFor } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
@Component({
  selector: 'app-table',
  standalone: true,
  imports: [NgFor, MatTableModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class TableComponent implements OnChanges {
  @Input() rows: {
    name: string;
    value: string;
    units?: string;
    icon?: string;
  }[] = [];
  displayedColumns: string[] = ['icon', 'name', 'value'];
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rows'] && changes['rows'].currentValue) {
    }
  }
}

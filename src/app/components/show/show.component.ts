import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-show',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './show.component.html',
  styleUrl: './show.component.scss',
})
export class ShowComponent implements OnChanges {
  @Input() key: any = undefined;
  @Input() value: any;
  @Input() maxLength = 40;
  @Input() label = '';
  @Input() collapsed = false;

  expanded = false;

  summary: string = '';
  items: { k: any; v: any }[];

  get isValid(): boolean {
    return ['number', 'string', 'boolean', 'undefined'].includes(
      typeof this.value
    );
  }
  isArray(value: any): boolean {
    return Array.isArray(value);
  }
  constructor() {
    this.invalidate();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && changes['value'].currentValue) {
      console.log(this.value);
      this.invalidate();
    }
  }
  invalidate() {
    this.summary = JSON.stringify(this.value);
    if (this.summary?.length >= this.maxLength) {
      this.summary = this.summary.substring(0, this.maxLength) + '...';
    }

    if (this.isArray(this.value)) {
      this.items = this.value.map((v, i) => ({ k: i, v: v }));
    } else if (typeof this.value === 'object' && this.value !== null) {
      this.items = Object.keys(this.value).map((k) => ({
        k: k,
        v: this.value[k],
      }));
    }
  }
}

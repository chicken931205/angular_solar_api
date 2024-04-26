import { Component, Input } from '@angular/core';
import { MaterialModule } from '../../../material-module';
@Component({
  selector: 'app-gauge',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './gauge.component.html',
  styleUrl: './gauge.component.scss',
})
export class GaugeComponent {
  @Input() icon!: string;
  @Input() title!: string;
  @Input() label!: string;
  @Input() value!: number;
  @Input() labelSuffix = '';
  @Input() min = 0.0;
  @Input() max = 100.0;

  get percentValue(): number {
    return (this.value / (this.max - this.min)) * 100.0;
  }
}

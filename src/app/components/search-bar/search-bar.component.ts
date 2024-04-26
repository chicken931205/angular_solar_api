import {
  Component,
  Input,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  EventEmitter,
} from '@angular/core';
import { MaterialModule } from '../../../material-module';
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent implements OnChanges, AfterViewInit {
  @ViewChild('myInput') searchInput!: ElementRef;

  @Input() location: google.maps.LatLng | undefined;
  @Output() locationChange = new EventEmitter<google.maps.LatLng | undefined>();
  @Input() zoom: number = 19;
  @Input() map?: google.maps.Map;
  @Input() initialValue?: { name: string; address: string };

  ngAfterViewInit(): void {
    this.searchInput.nativeElement.value = this.initialValue?.name;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['location'] && changes['location'].currentValue) {
      // Handle location change
      this.handleLocationChange(changes['location'].currentValue);
    }

    if (changes['map'] && changes['map'].currentValue) {
      // Handle map change
      this.handleMapChange(changes['map'].currentValue);
    }
  }
  handleLocationChange(newLocation: any): void {
    // Handle the new location value
  }

  handleMapChange(newMap: any): void {
    // Handle the new map value
    this.searchAddress();
  }

  async searchAddress() {
    if (this.map == undefined) return;
    let inputElement = this.searchInput.nativeElement as HTMLInputElement;
    const autocomplete = new google.maps.places.Autocomplete(inputElement, {
      fields: ['formatted_address', 'geometry', 'name'],
    });
    autocomplete.addListener('place_changed', async () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        inputElement.value = '';
        return;
      }
      if (place.geometry.viewport) {
        // map.fitBounds(place.geometry.viewport);
        this.map?.setCenter(place.geometry.location);
        this.map?.setZoom(this.zoom);
      } else {
        this.map?.setCenter(place.geometry.location);
        this.map?.setZoom(this.zoom);
      }

      this.location = place.geometry.location;
      this.locationChange.emit(this.location);
      if (place.name) {
        inputElement.value = place.name;
      } else if (place.formatted_address) {
        inputElement.value = place.formatted_address;
      }
    });
  }
}

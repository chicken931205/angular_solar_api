import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { NgIf } from '@angular/common';

import { RouterOutlet } from '@angular/router';

import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { SectionsComponent } from './sections/sections/sections.component';

import * as GMapLoader from '@googlemaps/js-api-loader';

import { GoogleMapsModule, MapGeocoder } from '@angular/google-maps';

import { environment } from '../environments/environment';
import { MaterialModule } from '../material-module';
import { MyFormsModule } from '../forms-module';
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    GoogleMapsModule,
    SearchBarComponent,
    SectionsComponent,
    NgIf,
    MaterialModule,
    MyFormsModule,
  ],
  standalone: true,
  providers: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
  title = 'angular-solar-potential';

  googleMapsApiKey: string = environment.googleMapsApiKey;

  @ViewChild('my_map') mapElement!: ElementRef;
  display: any;
  zoom: number = 19;
  defaultPlace = {
    name: 'Rinconada Library',
    address: '1213 Newell Rd, Palo Alto, CA 94303',
  };
  center: google.maps.LatLngLiteral = {
    lat: 24,
    lng: 12,
  };
  geoGeometry?: google.maps.GeocoderGeometry;
  options: google.maps.MapOptions = {
    zoom: this.zoom,
    tilt: 0,
    mapTypeId: 'satellite',
    mapTypeControl: false,
    fullscreenControl: false,
    rotateControl: false,
    streetViewControl: false,
    zoomControl: false,
    center: this.center,
  };
  location?: google.maps.LatLng;
  map!: google.maps.Map;

  constructor(geocoder: MapGeocoder) {
    geocoder
      .geocode({
        address: this.defaultPlace.address,
      })
      .subscribe(({ results }) => {
        this.geoGeometry = results[0].geometry;
        this.location = this.geoGeometry.location;
        this.center = this.location.toJSON();
        this.map.setCenter(this.center);
      });
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  moveMap(event: google.maps.MapMouseEvent) {
    if (event.latLng != null) this.center = event.latLng.toJSON();
  }
  move(event: google.maps.MapMouseEvent) {
    if (event.latLng != null) this.display = event.latLng.toJSON();
  }
  async initializeMap() {
    const { Map } = (await google.maps.importLibrary(
      'maps'
    )) as google.maps.MapsLibrary;
    this.map = new Map(this.mapElement.nativeElement, this.options);
    //    this.map = new google.maps.Map(this.mapElement, this.options);
  }
  /*
  map?: google.maps.Map;
  geometryLibrary?: google.maps.GeometryLibrary;
  placesLibrary?: google.maps.PlacesLibrary;
  @ViewChild('mapElement') mapElement?: ElementRef;
  tempElement?: HTMLElement;
  mapsLibrary?: google.maps.MapsLibrary;
  location: google.maps.LatLng | undefined;
  zoom: number = 19;
  defaultPlace = {
    name: 'Rinconada Library',
    address: '1213 Newell Rd, Palo Alto, CA 94303',
  };

  ngOnInit() {}
  constructor() {
    this.loadMap().then((value) => {
      console.log('Loaded.');
    });
  }
  ngAfterViewInit(): void {
    this.loadMap().then((_) => console.log('Loaded 2'));
  }
  async loadMap() {
    //    let apiKey = process.env['VITE_GOOGLE_MAPS_API_KEY'] ?? 'NONE';
    const loader = new Loader({
      apiKey: 'AIzaSyDG_qQ6ziZZ15oiF01vl3Zegv3qPf4gGkg',
    });
    const libraries = {
      geometry: loader.importLibrary('geometry'),
      maps: loader.importLibrary('maps'),
      places: loader.importLibrary('places'),
    };
    this.geometryLibrary = await libraries.geometry;
    this.mapsLibrary = await libraries.maps;
    this.placesLibrary = await libraries.places;
    const geocoder = new google.maps.Geocoder();
    const geocoderResponse = await geocoder.geocode({
      address: this.defaultPlace.address,
    });
    const geocoderResult = geocoderResponse.results[0];

    // Initialize the map at the desired location.
    this.location = geocoderResult.geometry.location;
    if (this.tempElement !== undefined) {
      this.map = new this.mapsLibrary.Map(this.tempElement, {
        center: this.location,
        zoom: this.zoom,
        tilt: 0,
        mapTypeId: 'satellite',
        mapTypeControl: false,
        fullscreenControl: false,
        rotateControl: false,
        streetViewControl: false,
        zoomControl: false,
      });
      this.mapElement = new ElementRef(this.tempElement);
      console.log(this.mapElement);
    }
  }
  */
}

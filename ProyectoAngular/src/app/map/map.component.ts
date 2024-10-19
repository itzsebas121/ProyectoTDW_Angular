import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import proj4 from 'proj4';
import { CommonModule } from '@angular/common';
import { FeatureCollection } from 'geojson';  // Importar el tipo FeatureCollection

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [HttpClientModule, CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  map!: mapboxgl.Map;
  private utm32717 = '+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs';  // Definir proyección UTM
  parroquias: any[] = [];  // Lista de parroquias cargadas del GeoJSON

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Inicializar el mapa de Mapbox
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-78.61675, -1.24908], // Centro de Tungurahua
      zoom: 12,
      accessToken: 'pk.eyJ1Ijoic2ViYXMxMjEiLCJhIjoiY20yOWNvNno3MDN2cTJ2cHl4OWk2d2l3aCJ9.zR3wF032kr8Fq9NvziGLEw'
    });

    this.map.on('load', () => {
      this.http.get('assets/data/Ambato_parroquias.geojson').subscribe((geojson: any) => {
        
        // Convertir las coordenadas UTM a lat/lng en EPSG:4326
        geojson.features.forEach((feature: any) => {
          feature.geometry.coordinates = feature.geometry.coordinates.map((polygon: any) =>
            polygon.map((ring: any) =>
              ring.map((coord: any) => {
                const [x, y] = coord;
                return proj4(this.utm32717, 'EPSG:4326', [x, y]);
              })
            )
          );
        });

        this.parroquias = geojson.features;

        // Agregar la fuente GeoJSON al mapa
        this.map.addSource('ambato-parroquias', {
          'type': 'geojson',
          'data': geojson
        });

        this.map.addLayer({
          'id': 'parroquias-fill',
          'type': 'fill',
          'source': 'ambato-parroquias',
          'paint': {
            'fill-color': '#088',
            'fill-opacity': 0.6
          }
        });

        this.map.addLayer({
          'id': 'parroquias-outline',
          'type': 'line',
          'source': 'ambato-parroquias',
          'paint': {
            'line-color': '#000',
            'line-width': 2
          }
        });
      });
    });
  }
  getLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Latitud:', position.coords.latitude, 'Longitud:', position.coords.longitude);
        },
        (error) => {
          console.error('Error al obtener la ubicación:', error);
        }
      );
    } else {
      alert('La Geolocalización no es soportada por este navegador.');
    }
  }
  
  onParishSelect(event: any): void {
    const selectedParishName = event.target.value;
    const selectedParish = this.parroquias.find(parroquia => parroquia.properties.DPA_DESPAR === selectedParishName);

    if (selectedParish) {
      // Definir el tipo explícitamente como FeatureCollection
      const selectedGeoJson: FeatureCollection = {
        type: "FeatureCollection",
        features: [selectedParish]
      };

      if (this.map.getLayer('selected-parroquia')) {
        (this.map.getSource('selected-parroquia') as mapboxgl.GeoJSONSource).setData(selectedGeoJson);
      } else {
        this.map.addSource('selected-parroquia', {
          'type': 'geojson',
          'data': selectedGeoJson
        });

        this.map.addLayer({
          'id': 'selected-parroquia',
          'type': 'fill',
          'source': 'selected-parroquia',
          'paint': {
            'fill-color': '#FF0000',
            'fill-opacity': 0.8
          }
        });
      }

      // Ajustar los límites del mapa para mostrar la parroquia seleccionada
      const bounds = new mapboxgl.LngLatBounds();
      selectedParish.geometry.coordinates[0].forEach((coord: any) => {
        bounds.extend(coord);
      });
      this.map.fitBounds(bounds, { padding: 20 });
    }
  }
}

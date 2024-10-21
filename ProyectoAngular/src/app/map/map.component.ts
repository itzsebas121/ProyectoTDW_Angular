import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
  @Output() parroquiaSelected = new EventEmitter<any>();

  //Esta funcion nos permite centar el mapa, los parametros que recibe  es la latidud, la longitus y el nivel de visualizacion 
  //en el que deseamos ver el mapa
  loadMap(longitude: number, latitude: number, zoom: number): void {
    if (this.map) {
      // Si el mapa ya está inicializado, actualiza su centro y zoom
      this.map.setCenter([longitude, latitude]);
      this.map.setZoom(zoom);
      return;
    }
  
    // Inicializar el mapa solo si no está ya inicializado
    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [longitude, latitude],
      zoom: zoom,
      accessToken: 'pk.eyJ1Ijoic2ViYXMxMjEiLCJhIjoiY20yOWNvNno3MDN2cTJ2cHl4OWk2d2l3aCJ9.zR3wF032kr8Fq9NvziGLEw'
    });
  }

  map!: mapboxgl.Map;
  private utm32717 = '+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs';  // Definir proyección UTM
  parroquias: any[] = [];  // Lista de parroquias cargadas del GeoJSON

  constructor(private http: HttpClient) { }

  ngOnInit(): void {

    //Al cargar el componente se centrara el mapa
    this.loadMap(-78.61675, -1.24908, 9.5);

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
            'fill-color': '#0000ff',
            'fill-opacity': 0.2
          }
        });

        this.map.addLayer({
          'id': 'parroquias-outline',
          'type': 'line',
          'source': 'ambato-parroquias',
          'paint': {
            'line-color': '#444',
            'line-width': 1
          }
        });
      });
    });
  }
  getLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.loadMap(position.coords.longitude, position.coords.latitude, 14)
          
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
    this.parroquiaSelected.emit(event.target.value)
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
                    'fill-color': '#ffFF00',
                    'fill-opacity': 0.2
                }
            });
        }

        // Ajustar los límites del mapa para mostrar la parroquia seleccionada
        const bounds = new mapboxgl.LngLatBounds();
        
        // Iterar sobre todos los anillos de coordenadas
        selectedParish.geometry.coordinates.forEach((ring: any[]) => {
            ring.forEach((coord: any) => {
                bounds.extend(coord);
            });
        });

        this.map.fitBounds(bounds, { padding: 20, maxZoom: 11 });
    }
}

}

import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  map!: mapboxgl.Map;

  ngOnInit(): void {
    this.map = new mapboxgl.Map({
      container: 'map', 
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-78.61675, -1.24908], // Centro de Tungurahua
      zoom: 12, // Ajusta el zoom para mostrar toda la provincia
      accessToken: 'pk.eyJ1Ijoic2ViYXMxMjEiLCJhIjoiY20yOWNvNno3MDN2cTJ2cHl4OWk2d2l3aCJ9.zR3wF032kr8Fq9NvziGLEw'
    });

    this.map.on('load', () => {
      // Usa las coordenadas GeoJSON del contorno de Tungurahua
      /* this.map.addSource('tungurahua-polygon', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [
              [
                [-78.654, -1.265],
                [-78.640, -1.260],
                [-78.630, -1.250],
                [-78.654, -1.265] 
              ]
            ]
          },
          'properties': {}
        }
      });
 */
      // Capa para el polígono
     /*  this.map.addLayer({
        'id': 'tungurahua-layer',
        'type': 'fill',
        'source': 'tungurahua-polygon',
        'layout': {},
        'paint': {
          'fill-color': '#FF0000', // Color rojo
          'fill-opacity': 0.5
        }
      });

      // Capa para el borde del polígono
      this.map.addLayer({
        'id': 'tungurahua-outline-layer',
        'type': 'line',
        'source': 'tungurahua-polygon',
        'layout': {},
        'paint': {
          'line-color': '#000000', // Color del contorno
          'line-width': 2
        }
      }); */
    });
  }
}
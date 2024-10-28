import { Component, EventEmitter, Output, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { HttpClient } from '@angular/common/http';
import proj4 from 'proj4';
import { CommonModule } from '@angular/common';
import { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson';
import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit {
  @Output() parroquiaSelected = new EventEmitter<string>();
  selectedParishName: string = '';


  map!: mapboxgl.Map;
  private utm32717 = '+proj=utm +zone=17 +south +datum=WGS84 +units=m +no_defs';
  parroquias: Parroquia[] = [];

  @ViewChild('parishSelect') parishSelectRef!: ElementRef<HTMLSelectElement>;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    // Inicializar el mapa
    this.loadMap(-78.61675, -1.24908, 9.5);

    // Esperar a que el mapa se cargue completamente
    this.map.on('load', () => {
      // Cargar las parroquias
      this.loadParishes();

      // Agregar listener para clic en el mapa
      this.map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        this.onMapClick(lng, lat);
      });
    });
  }

  loadMap(longitude: number, latitude: number, zoom: number): void {
    if (!this.map) {
      this.map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [longitude, latitude],
        zoom: zoom,
        accessToken: 'pk.eyJ1Ijoic2ViYXMxMjEiLCJhIjoiY20yOWNvNno3MDN2cTJ2cHl4OWk2d2l3aCJ9.zR3wF032kr8Fq9NvziGLEw', // Reemplaza con tu token de Mapbox
      });
    } else {
      this.map.setCenter([longitude, latitude]);
      this.map.setZoom(zoom);
    }
  }

  loadParishes(): void {
    this.http.get<any>('assets/data/Ambato_parroquias.geojson').subscribe(
      (geojson) => {
        // Convertir coordenadas UTM a lat/lng
        geojson.features.forEach((feature: any) => {
          if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates = feature.geometry.coordinates.map(
              (ring: any) => {
                let transformedRing = ring.map((coord: any) => {
                  const [x, y] = coord;
                  return proj4(this.utm32717, 'EPSG:4326', [x, y]);
                });

                // Asegurar que el anillo está cerrado
                const firstPoint = transformedRing[0];
                const lastPoint =
                  transformedRing[transformedRing.length - 1];
                if (
                  firstPoint[0] !== lastPoint[0] ||
                  firstPoint[1] !== lastPoint[1]
                ) {
                  transformedRing.push(firstPoint);
                }

                return transformedRing;
              }
            );
          } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates = feature.geometry.coordinates.map(
              (polygon: any) =>
                polygon.map((ring: any) => {
                  let transformedRing = ring.map((coord: any) => {
                    const [x, y] = coord;
                    return proj4(this.utm32717, 'EPSG:4326', [x, y]);
                  });

                  // Asegurar que el anillo está cerrado
                  const firstPoint = transformedRing[0];
                  const lastPoint =
                    transformedRing[transformedRing.length - 1];
                  if (
                    firstPoint[0] !== lastPoint[0] ||
                    firstPoint[1] !== lastPoint[1]
                  ) {
                    transformedRing.push(firstPoint);
                  }

                  return transformedRing;
                })
            );
          }
        });

        this.parroquias = geojson.features as Parroquia[];

        // Agregar la fuente GeoJSON al mapa
        if (!this.map.getSource('ambato-parroquias')) {
          this.map.addSource('ambato-parroquias', {
            type: 'geojson',
            data: geojson,
          });
        }

        // Agregar las capas si no existen
        if (!this.map.getLayer('parroquias-fill')) {
          this.map.addLayer({
            id: 'parroquias-fill',
            type: 'fill',
            source: 'ambato-parroquias',
            paint: {
              'fill-color': '#0000ff',
              'fill-opacity': 0.2,
            },
          });
        }

        if (!this.map.getLayer('parroquias-outline')) {
          this.map.addLayer({
            id: 'parroquias-outline',
            type: 'line',
            source: 'ambato-parroquias',
            paint: {
              'line-color': '#444',
              'line-width': 1,
            },
          });
        }
      },
      (error) => {
        console.error('Error al cargar las parroquias:', error);
      }
    );
  }

  getLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          this.loadMap(lng, lat, 14);

          // Determinar y resaltar la parroquia
          this.onMapClick(lng, lat);
        },
        (error) => {
          console.error('Error al obtener la ubicación:', error);
        }
      );
    } else {
      alert('La Geolocalización no es soportada por este navegador.');
    }
  }

  onMapClick(lng: number, lat: number): void {
    if (this.parroquias.length === 0) {
      console.warn('Las parroquias aún no han sido cargadas.');
      return;
    }

    const pointFeature = point([lng, lat]);

    const selectedParish = this.parroquias.find((parroquia) => {
      if (parroquia.geometry.type === 'Polygon') {
        return booleanPointInPolygon(pointFeature, parroquia.geometry as any);
      } else if (parroquia.geometry.type === 'MultiPolygon') {
        for (const coordinates of parroquia.geometry.coordinates) {
          const polygon = {
            type: 'Polygon',
            coordinates: coordinates,
          };
          if (booleanPointInPolygon(pointFeature, polygon as any)) {
            return true;
          }
        }
        return false;
      } else {
        return false;
      }
    });

    if (selectedParish) {
      this.highlightParish(selectedParish);

      // Actualizar el valor del select
      this.selectedParishName = selectedParish.properties['DPA_DESPAR'];

      // Emitir el evento de selección de parroquia si es necesario
      this.parroquiaSelected.emit(this.selectedParishName);
    } else {
      alert('No se encontró ninguna parroquia en esta ubicación.');
    }
  }

  highlightParish(selectedParish: Parroquia): void {
    const selectedGeoJson: FeatureCollection = {
      type: 'FeatureCollection',
      features: [selectedParish],
    };

    if (this.map.getSource('selected-parroquia')) {
      (
        this.map.getSource('selected-parroquia') as mapboxgl.GeoJSONSource
      ).setData(selectedGeoJson);
    } else {
      this.map.addSource('selected-parroquia', {
        type: 'geojson',
        data: selectedGeoJson,
      });

      this.map.addLayer({
        id: 'selected-parroquia',
        type: 'fill',
        source: 'selected-parroquia',
        paint: {
          'fill-color': '#ffFF00',
          'fill-opacity': 0.5,
        },
      });
    }

    // Ajustar los límites del mapa para mostrar la parroquia seleccionada
    const bounds = new mapboxgl.LngLatBounds();

    if (selectedParish.geometry.type === 'Polygon') {
      selectedParish.geometry.coordinates.forEach((ring: any[]) => {
        ring.forEach((coord: any) => {
          bounds.extend(coord as [number, number]);
        });
      });
    } else if (selectedParish.geometry.type === 'MultiPolygon') {
      selectedParish.geometry.coordinates.forEach((polygon: any[]) => {
        polygon.forEach((ring: any[]) => {
          ring.forEach((coord: any) => {
            bounds.extend(coord as [number, number]);
          });
        });
      });
    }

    this.map.fitBounds(bounds, { padding: 20, maxZoom: 12 });
  }

  onParishSelect(event: any): void {
    const selectedParishName = event.target.value;
    this.parroquiaSelected.emit(selectedParishName);
    const selectedParish = this.parroquias.find(
      (parroquia) =>
        parroquia.properties?.['DPA_DESPAR'] === selectedParishName
    );

    if (selectedParish) {
      this.highlightParish(selectedParish);
    }
  }
}

// Definición de la interfaz Parroquia para mejorar los tipos
interface Parroquia extends Feature<Polygon | MultiPolygon> {
  properties: {
    [key: string]: any;
    'DPA_DESPAR': string;
  };
}

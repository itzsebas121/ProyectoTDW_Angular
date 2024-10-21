import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MapComponent } from './map/map.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MapComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Horarios Corte de Luz';
  parroquiaSlected: any;

  handleLocation(location: any) {
    this.parroquiaSlected = location;
    // Aquí puedes hacer más lógica, como enviar los datos a un servicio o mostrar más información
    console.log('Ubicación seleccionada:', location);
  }
}

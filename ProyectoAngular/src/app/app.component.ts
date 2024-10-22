import { Component, Input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MapComponent } from './map/map.component';
import { Parroquias } from './Components/Parroquias.model';
import { CommonModule } from '@angular/common'; // Asegúrate de importar CommonModule

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MapComponent, CommonModule], // Añadir CommonModule aquí
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Horarios Corte de Luz';

  @Input() parroquia: Parroquias = {
    name: "",
    alimentador: "",
    sectores: [],
    horarios: {
      lunes: "",
      martes: "",
      miercoles: "",
      jueves: "",
      viernes: "",
      sabado: "",
      domingo: ""
    }
  };

  parroquiaSelected: any = null;

  handleLocation(location: string) {
    this.parroquiaSelected = null;
    this.getDataParroquia(location);
  }

  getDataParroquia(parroquiaName: string) {
    fetch('assets/data/Parroquias.json')
      .then(response => response.json())
      .then(data => {
        const selectedParroquia = data.Ambato.find((parroquia: any) => parroquia.parroquia === parroquiaName);
        if (selectedParroquia) {
          this.parroquiaSelected = selectedParroquia;
        }
      })
      .catch(error => console.error('Error al cargar el archivo JSON:', error));
  }
}

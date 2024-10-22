import { Component, Input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MapComponent } from './map/map.component';
import { Parroquias } from './Components/Parroquias.model';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MapComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Horarios Corte de Luz';
  @Input() parroquia: Parroquias = {
    name: "",
    alimentador: "",
    sectores: [],
    hoarios: {
      lunes: "",
      martes: "",
      miercoles: "",
      jueves: "",
      viernes: "",
      sabado: "",
      domingo: ""
    }
  }
  @Input() parroquiaSelected = "";
  handleLocation(location: string) {
    this.parroquiaSelected = location;
    this.getDataParroquia()
  }
  getDataParroquia() {
    fetch('assets/data/Parroquias.json')
      .then(response => { return response.json() })
      .then(
        data => {
          for (let i = 0; i < data.Ambato.length; i++) {
            if (data.Ambato[i].parroquia == this.parroquiaSelected) {
              this.parroquia.name = data.Ambato[i].parroquia;
              this.parroquia.alimentador = data.Ambato[i].alimentador;
              this.parroquia.sectores.push = data.Ambato[i].sectores;
              this.parroquia.hoarios.lunes = data.Ambato[i].horarios.Lunes;
              this.parroquia.hoarios.martes = data.Ambato[i].horarios.Martes;
              this.parroquia.hoarios.miercoles = data.Ambato[i].horarios.Miercoles;
              this.parroquia.hoarios.jueves = data.Ambato[i].horarios.Jueves;
              this.parroquia.hoarios.viernes = data.Ambato[i].horarios.Viernes;
              this.parroquia.hoarios.sabado = data.Ambato[i].horarios.Sabado;
              this.parroquia.hoarios.domingo = data.Ambato[i].horarios.Domingo;
            }
          }
        }
      );
  }
  

}

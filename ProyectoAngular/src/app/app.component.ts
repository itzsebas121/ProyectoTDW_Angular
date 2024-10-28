import { Component, Input, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MapComponent } from './map/map.component';
import { HorariosService } from './services/horarios.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, MapComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  horarioNuevo: any = {
    parroquia: '',
    alimentador: '',
    sectores: [],
    horarios: {}
  };
  title = 'Horarios Corte de Luz';
  isLoggedIn = false;
  showLoginOverlay = false;
  showOverlayHorarios = false;

  parroquias: any[] = [];
  alimentadores: any[] = [];
  selectedParroquia = '';
  selectedAlimentador = '';
  selectedDia = '';
  horaInicio = '';
  horaFin = '';

  // Lista de horarios temporal para agregar y luego guardar
  horarios: { dia: string; inicio: string; fin: string; alimentador: string }[] = [];
  parroquiaSelected: any = null;

  constructor(private http: HttpClient, private horariosService: HorariosService) {}

  ngOnInit() {
    this.cargarDatosParroquias();
  }

  // Cargar los datos iniciales de las parroquias
  cargarDatosParroquias() {
    this.horariosService.obtenerDatos().subscribe(data => {
      this.parroquias = data.parroquias;
    });
  }

  // Actualizar los alimentadores al seleccionar una parroquia
  onParroquiaChange() {
    const parroquiaSeleccionada = this.parroquias.find(parroquia => parroquia.nombre === this.selectedParroquia);
    this.alimentadores = parroquiaSeleccionada ? parroquiaSeleccionada.alimentadores : [];
  }

  // Agregar un nuevo horario a la lista temporal
  agregarHorario() {
    if (this.selectedDia && this.horaInicio && this.horaFin && this.selectedAlimentador) {
      this.horarios.push({
        dia: this.selectedDia,
        inicio: this.horaInicio,
        fin: this.horaFin,
        alimentador: this.selectedAlimentador
      });

      // Limpiar los valores de los campos en la interfaz, pero no de la lista
      this.selectedDia = '';
      this.horaInicio = '';
      this.horaFin = '';
      this.selectedAlimentador = '';
    }
  }

  // Eliminar un horario de la lista temporal
  eliminarHorario(horario: { dia: string; inicio: string; fin: string; alimentador: string }) {
    this.horarios = this.horarios.filter(h => h !== horario);
  }

  // Mostrar el overlay para agregar horarios
  mostrarOverlayHorarios() {
    this.showOverlayHorarios = true;
  }

  // Cerrar el overlay de horarios
  cerrarOverlayHorarios() {
    this.showOverlayHorarios = false;
  }

  // Alternar la visibilidad del overlay de login
  toggleLogin() {
    this.showLoginOverlay = !this.showLoginOverlay;
  }

  // Iniciar sesión
  login(event: Event) {
    event.preventDefault();
    this.isLoggedIn = true;
    this.showLoginOverlay = false;
  }

  // Cancelar el login
  cancelLogin() {
    this.showLoginOverlay = false;
  }

  // Obtener información de una parroquia específica
  handleLocation(location: string) {
    this.parroquiaSelected = null;
    this.getDataParroquia(location);
  }

  // Cargar datos de la parroquia seleccionada desde el archivo JSON
  getDataParroquia(parroquiaName: string) {
    this.horariosService.obtenerDatos().subscribe(data => {
      const selectedParroquia = data.parroquias.find(
        (parroquia: any) => parroquia.nombre.toUpperCase() === parroquiaName.toUpperCase()
      );
      if (selectedParroquia) {
        this.parroquiaSelected = selectedParroquia;
      } else {
        console.log('Parroquia no encontrada');
      }
    });
  }

  // Guardar los horarios en el servidor usando HorariosService
  guardarHorarios() {
    const nuevoHorario = {
      parroquia: this.selectedParroquia,
      alimentador: this.horarios[0]?.alimentador || '',
      sectores: this.alimentadores.find(al => al.nombre === this.horarios[0]?.alimentador)?.sectores || [],
      horarios: this.horarios.reduce((acc, curr) => {
        if (!acc[curr.dia]) acc[curr.dia] = [];
        acc[curr.dia].push(`${curr.inicio} - ${curr.fin}`);
        return acc;
      }, {} as any)
    };

    this.horariosService.guardarHorario(nuevoHorario).subscribe(
      response => {
        console.log('Horario guardado:', response);
        this.showOverlayHorarios = false;
      },
      error => {
        console.error('Error al guardar el horario:', error);
      }
    );
  }

  // Método para ordenar los días de la semana
  obtenerHorariosOrdenados(horarios: any) {
    const diasSemanaOrdenados = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    // Ajustar la estructura para que el valor sea siempre un array, si es un string convertirlo a un array
    return diasSemanaOrdenados
      .map(dia => ({
        dia,
        rango: Array.isArray(horarios[dia]) ? horarios[dia] : [horarios[dia]].filter(v => v)
      }))
      .filter(item => item.rango && item.rango.length > 0);
  }
}

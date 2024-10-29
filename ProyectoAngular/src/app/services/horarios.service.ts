import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HorariosService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  obtenerDatos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/alimentadores`);
  }

  guardarHorario(nuevoHorario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/guardar-horario`, nuevoHorario);
  }
}

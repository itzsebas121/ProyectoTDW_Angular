export interface Parroquias {
    name: string;
    alimentador: string;
    sectores: [];
    horarios: {
        lunes: string;
        martes: string;
        miercoles: string;
        jueves: string;
        viernes: string;
        sabado: string;
        domingo: string;
    }
}
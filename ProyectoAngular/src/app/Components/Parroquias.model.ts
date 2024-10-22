export interface Parroquias {
    name: string;
    alimentador: string;
    sectores: [];
    hoarios: {
        lunes: string;
        martes: string;
        miercoles: string;
        jueves: string;
        viernes: string;
        sabado: string;
        domingo: string;
    }
}
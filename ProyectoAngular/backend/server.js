const path = require('path');
const express = require('express');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/alimentadores', (req, res) => {
    const filePath = path.join(__dirname, '..', 'src', 'assets', 'data', 'alimentadores.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo JSON:', err);
            return res.status(500).json({ message: 'Error al leer el archivo JSON' });
        }
        res.json(JSON.parse(data));
    });
});

app.post('/api/guardar-horario', (req, res) => {
    const nuevoHorario = req.body;
    const filePath = path.join(__dirname, '..', 'src', 'assets', 'data', 'alimentadores.json');

    // Verificar si el nombre del alimentador es válido
    if (!nuevoHorario.alimentador || nuevoHorario.alimentador.trim() === "") {
        return res.status(400).json({ message: 'El nombre del alimentador no puede estar vacío' });
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo JSON:', err);
            return res.status(500).json({ message: 'Error al leer el archivo JSON' });
        }

        let jsonData = JSON.parse(data);
        let horarioActualizado = false;

        // Buscar la parroquia y el alimentador específico para actualizar solo el día
        jsonData.parroquias.forEach(parroquia => {
            if (parroquia.nombre === nuevoHorario.parroquia) {
                parroquia.alimentadores.forEach(alimentador => {
                    if (alimentador.nombre === nuevoHorario.alimentador) {
                        // Actualizar solo el día específico en los horarios del alimentador
                        Object.keys(nuevoHorario.horarios).forEach(dia => {
                            alimentador.horarios[dia] = nuevoHorario.horarios[dia];
                        });
                        horarioActualizado = true;
                    }
                });
            }
        });

        // Si no se encontró el alimentador, agregarlo a la parroquia existente
        if (!horarioActualizado) {
            const nuevaEntrada = {
                nombre: nuevoHorario.alimentador,
                sectores: nuevoHorario.sectores,
                horarios: nuevoHorario.horarios
            };
            const parroquiaExistente = jsonData.parroquias.find(
                parroquia => parroquia.nombre === nuevoHorario.parroquia
            );

            if (parroquiaExistente) {
                parroquiaExistente.alimentadores.push(nuevaEntrada);
            } else {
                // Si la parroquia no existe, se crea y se añade el nuevo alimentador
                jsonData.parroquias.push({
                    nombre: nuevoHorario.parroquia,
                    alimentadores: [nuevaEntrada]
                });
            }
        }

        // Escribir la lista actualizada en el archivo JSON
        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error al escribir en el archivo JSON:', err);
                return res.status(500).json({ message: 'Error al escribir en el archivo JSON' });
            }
            res.json({ message: 'Horario guardado correctamente' });
        });
    });
});

app.listen(PORT,() => {
    console.log('Servidor corriendo en http://0.0.0.0:3000');
  }); 

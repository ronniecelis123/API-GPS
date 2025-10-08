require('dotenv').config(); // Para usar variables de entorno en local

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// Base de datos usando DATABASE_URL (Render la provee en prod)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Necesario en Render
  },
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Ruta para guardar ubicación
app.post('/ubicacion', async (req, res) => {
  const { unidad_id, lat, lon } = req.body;

  if (!unidad_id || lat === undefined || lon === undefined) {
    return res.status(400).send('Faltan datos: unidad_id, lat o lon');
  }

  try {
    await pool.query(`
      INSERT INTO ubicaciones (unidad_id, latitud, longitud, actualizado)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (unidad_id)
      DO UPDATE SET latitud = EXCLUDED.latitud,
                    longitud = EXCLUDED.longitud,
                    actualizado = CURRENT_TIMESTAMP
    `, [unidad_id, lat, lon]);

    res.send('Coordenadas actualizadas');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar');
  }
});

// Ruta para obtener ubicación
app.get('/ubicacion/:unidad_id', async (req, res) => {
  const { unidad_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM ubicaciones WHERE unidad_id = $1',
      [unidad_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Unidad no encontrada');
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al consultar');
  }
});

// Arranque del servidor
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});

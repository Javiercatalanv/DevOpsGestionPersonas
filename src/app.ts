import express, { Request, Response } from 'express';
import { Pool } from 'pg';

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'personas',
});

// Crear tablas si no existen
export const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS personas (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      rut VARCHAR(20) NOT NULL UNIQUE,
      fecha_nacimiento DATE NOT NULL,
      ciudad VARCHAR(100) NOT NULL
    );
    CREATE TABLE IF NOT EXISTS gustos (
      id SERIAL PRIMARY KEY,
      persona_rut VARCHAR(20) REFERENCES personas(rut) ON DELETE CASCADE,
      gusto VARCHAR(100) NOT NULL
    );
  `);
};

// POST /personas
app.post('/personas', async (req: Request, res: Response) => {
  const { nombre, rut, fechaNacimiento, ciudad, gustos } = req.body;
  if (!nombre || !rut || !fechaNacimiento || !ciudad) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    await pool.query(
      'INSERT INTO personas (nombre, rut, fecha_nacimiento, ciudad) VALUES ($1, $2, $3, $4)',
      [nombre, rut, fechaNacimiento, ciudad]
    );
    if (gustos && gustos.length > 0) {
      for (const gusto of gustos) {
        await pool.query(
          'INSERT INTO gustos (persona_rut, gusto) VALUES ($1, $2)',
          [rut, gusto]
        );
      }
    }
    const persona = { nombre, rut, fechaNacimiento, ciudad, gustos: gustos || [] };
    return res.status(201).json(persona);
  } catch (error) {
    return res.status(500).json({ error: 'Error al agregar persona' });
  }
});

// GET /personas
app.get('/personas', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM personas');
    const personas = await Promise.all(result.rows.map(async (p) => {
      const gustosResult = await pool.query(
        'SELECT gusto FROM gustos WHERE persona_rut = $1',
        [p.rut]
      );
      return {
        id: p.id,
        nombre: p.nombre,
        rut: p.rut,
        fechaNacimiento: p.fecha_nacimiento,
        ciudad: p.ciudad,
        gustos: gustosResult.rows.map(g => g.gusto)
      };
    }));
    res.json(personas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener personas' });
  }
});

// DELETE /personas/:rut
app.delete('/personas/:rut', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM personas WHERE rut = $1 RETURNING *',
      [req.params.rut]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Error al eliminar persona' });
  }
});

export const resetPersonas = async () => {
  await pool.query('DELETE FROM gustos');
  await pool.query('DELETE FROM personas');
};

export default app;
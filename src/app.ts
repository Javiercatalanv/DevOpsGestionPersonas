import express, { Request, Response } from 'express';
const app = express();
app.use(express.json());

interface Persona {
  id: number;
  nombre: string;
  rut: string;
  fechaNacimiento: string;
  ciudad: string;
}

let personas: Persona[] = [];

// POST para personas
app.post('/personas', (req: Request, res: Response) => {
  const { nombre, rut, fechaNacimiento, ciudad } = req.body;
  if (!nombre || !rut || !fechaNacimiento || !ciudad) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const persona: Persona = { id: Date.now(), nombre, rut, fechaNacimiento, ciudad };
  personas.push(persona);
  return res.status(201).json(persona);
});

// GET para obtener todas las personas
app.get('/personas', (_req: Request, res: Response) => {
  res.json(personas);
});

// DELETE personas por su rut
app.delete('/personas/:rut', (req: Request, res: Response) => {
  const index = personas.findIndex(p => p.rut === req.params.rut);
  if (index === -1) {
    return res.status(404).json({ error: 'Persona no encontrada' });
  }
  personas.splice(index, 1);
  return res.status(204).send();
});

export const resetPersonas = () => { personas = []; };
export default app;
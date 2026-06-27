import request from 'supertest';
import app from '../src/app';

// Mock del módulo pg
jest.mock('pg', () => {
  const personas: any[] = [];
  const gustos: any[] = [];
  
  return {
    Pool: jest.fn().mockImplementation(() => ({
      query: jest.fn().mockImplementation((sql: string, params?: any[]) => {
        // CREATE TABLE
        if (sql.includes('CREATE TABLE')) {
          return Promise.resolve({ rows: [] });
        }
        // DELETE FROM gustos (reset)
        if (sql.trim() === 'DELETE FROM gustos') {
          gustos.length = 0;
          return Promise.resolve({ rows: [] });
        }
        // DELETE FROM personas (reset)
        if (sql.trim() === 'DELETE FROM personas') {
          personas.length = 0;
          return Promise.resolve({ rows: [] });
        }
        // INSERT persona
        if (sql.includes('INSERT INTO personas')) {
          personas.push({ nombre: params![0], rut: params![1], fecha_nacimiento: params![2], ciudad: params![3] });
          return Promise.resolve({ rows: [] });
        }
        // INSERT gusto
        if (sql.includes('INSERT INTO gustos')) {
          gustos.push({ persona_rut: params![0], gusto: params![1] });
          return Promise.resolve({ rows: [] });
        }
        // SELECT personas
        if (sql.includes('SELECT * FROM personas')) {
          return Promise.resolve({ rows: [...personas] });
        }
        // SELECT gustos por rut
        if (sql.includes('SELECT gusto FROM gustos')) {
          const rutGustos = gustos.filter(g => g.persona_rut === params![0]);
          return Promise.resolve({ rows: rutGustos });
        }
        // DELETE persona por rut
        if (sql.includes('DELETE FROM personas WHERE rut')) {
          const index = personas.findIndex(p => p.rut === params![0]);
          if (index === -1) return Promise.resolve({ rowCount: 0, rows: [] });
          personas.splice(index, 1);
          return Promise.resolve({ rowCount: 1, rows: [] });
        }
        return Promise.resolve({ rows: [] });
      })
    }))
  };
});

beforeEach(async () => {
  const { resetPersonas } = require('../src/app');
  await resetPersonas();
});

describe('POST /personas', () => {
  it('agrega una persona correctamente', async () => {
    const res = await request(app).post('/personas').send({
      nombre: 'Juan Pérez', rut: '12345678-9',
      fechaNacimiento: '1990-01-01', ciudad: 'Santiago',
      gustos: ['fútbol', 'música']
    });
    expect(res.status).toBe(201);
    expect(res.body.nombre).toBe('Juan Pérez');
    expect(res.body.gustos).toEqual(['fútbol', 'música']);
  });

  it('retorna 400 si faltan campos', async () => {
    const res = await request(app).post('/personas').send({ nombre: 'Sin datos' });
    expect(res.status).toBe(400);
  });
});

describe('GET /personas', () => {
  it('retorna lista vacía al inicio', async () => {
    const res = await request(app).get('/personas');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('retorna personas agregadas', async () => {
    await request(app).post('/personas').send({
      nombre: 'Ana García', rut: '98765432-1',
      fechaNacimiento: '1995-05-10', ciudad: 'Valparaíso',
      gustos: ['lectura']
    });
    const res = await request(app).get('/personas');
    expect(res.body.length).toBe(1);
  });
});

describe('DELETE /personas/:rut', () => {
  it('elimina una persona existente', async () => {
    await request(app).post('/personas').send({
      nombre: 'Ana García', rut: '98765432-1',
      fechaNacimiento: '1995-05-10', ciudad: 'Valparaíso',
      gustos: []
    });
    const res = await request(app).delete('/personas/98765432-1');
    expect(res.status).toBe(204);
  });

  it('retorna 404 si no existe', async () => {
    const res = await request(app).delete('/personas/00000000-0');
    expect(res.status).toBe(404);
  });
});
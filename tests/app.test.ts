import request from 'supertest';
import { describe, it, beforeEach, expect } from '@jest/globals';
import app, { resetPersonas } from '../src/app';

beforeEach(() => resetPersonas());

//----------------------------------------------------------------------------------
describe('POST /personas', () => {
  it('agrega una persona correctamente', async () => {
    const res = await request(app).post('/personas').send({
      nombre: 'Juan Pérez', rut: '12345678-9',
      fechaNacimiento: '1990-01-01', ciudad: 'Santiago'
    });
    expect(res.status).toBe(201);
    expect(res.body.nombre).toBe('Juan Pérez');
  });

  it('retorna 400 si faltan campos', async () => {
    const res = await request(app).post('/personas').send({ nombre: 'Sin datos' });
    expect(res.status).toBe(400);
  });
});


//----------------------------------------------------------------------------------
describe('GET /personas', () => {
  it('retorna lista vacía al inicio', async () => {
    const res = await request(app).get('/personas');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('retorna personas agregadas', async () => {
    await request(app).post('/personas').send({
      nombre: 'Ana García', rut: '98765432-1',
      fechaNacimiento: '1995-05-10', ciudad: 'Valparaíso'
    });
    const res = await request(app).get('/personas');
    expect(res.body.length).toBe(1);
  });
});


//----------------------------------------------------------------------------------
describe('DELETE /personas/:rut', () => {
  it('elimina una persona existente', async () => {
    await request(app).post('/personas').send({
      nombre: 'Ana García', rut: '98765432-1',
      fechaNacimiento: '1995-05-10', ciudad: 'Valparaíso'
    });
    const res = await request(app).delete('/personas/98765432-1');
    expect(res.status).toBe(204);
  });

  it('retorna 404 si no existe', async () => {
    const res = await request(app).delete('/personas/00000000-0');
    expect(res.status).toBe(404);
  });
});
import app, { initDB } from './app';

const PORT = process.env.PORT || 3000;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}).catch((err) => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});
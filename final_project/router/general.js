// Paso 1: Importar dependencias necesarias
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const session = require('express-session');
const booksdb = require('./booksdb.js'); // Importar el archivo de libros
const axios = require('axios'); // Importar Axios

// Paso 2: Configurar variables de entorno
const PORT = process.env.PORT || 5000;

// Paso 3: Configurar servidor Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Paso 4: Definir modelos y datos
// Utilizaremos el archivo booksdb.js para obtener la base de datos de libros
const books = booksdb;
let users = []; // Lista de usuarios registrados

// Paso 5: Definir controladores y rutas para funcionalidades
// Rutas de libros
const public_users = express.Router();

public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Nombre de usuario y contraseña son requeridos" });
  }
  if (users.find(user => user.username === username)) {
    return res.status(400).json({ message: "El usuario ya existe" });
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ username, password: hashedPassword });
  return res.status(201).json({ message: "Usuario registrado exitosamente" });
});

public_users.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Nombre de usuario y contraseña son requeridos" });
  }
  const user = users.find(user => user.username === username);
  if (!user) {
    return res.status(400).json({ message: "Credenciales incorrectas" });
  }
  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Credenciales incorrectas" });
  }
  return res.status(200).json({ message: "Inicio de sesión exitoso" });
});

// Obtener la lista de libros usando async/await (Task 10)
public_users.get('/async/books', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/public');
    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).send('Error obteniendo los libros');
  }
});

// Obtener libro por ISBN usando Promises (Task 11)
public_users.get('/promise/isbn/:isbn', (req, res) => {
  axios.get(`http://localhost:5000/public/isbn/${req.params.isbn}`)
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(error => {
      res.status(404).send('Libro no encontrado');
    });
});

// Obtener libros por autor usando async/await (Task 12)
public_users.get('/async/author/:author', async (req, res) => {
  try {
    const response = await axios.get(`http://localhost:5000/public/author/${req.params.author}`);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(404).send('No se encontraron libros para el autor proporcionado');
  }
});

// Obtener libros por título usando Promises (Task 13)
public_users.get('/promise/title/:title', (req, res) => {
  axios.get(`http://localhost:5000/public/title/${req.params.title}`)
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(error => {
      res.status(404).send('No se encontraron libros con el título proporcionado');
    });
});

public_users.get('/', async (req, res) => {
  try {
    res.send(JSON.stringify(books, null, 2));
  } catch (err) {
    res.status(500).send('Error obteniendo los libros');
  }
});

public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const book = books[req.params.isbn];
    if (book) {
      res.send(JSON.stringify(book, null, 2));
    } else {
      res.status(404).send('Libro no encontrado');
    }
  } catch (err) {
    res.status(500).send('Error obteniendo el libro');
  }
});

// Obtener detalles del libro basado en el autor
public_users.get('/author/:author', (req, res) => {
  const author = req.params.author.toLowerCase();
  const filteredBooks = Object.values(books).filter(book => book.author.toLowerCase() === author);
  if (filteredBooks.length > 0) {
    res.send(JSON.stringify(filteredBooks, null, 2));
  } else {
    res.status(404).send('No se encontraron libros para el autor proporcionado');
  }
});

// Obtener todos los libros basados en el título
public_users.get('/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();
  const filteredBooks = Object.values(books).filter(book => book.title.toLowerCase() === title);
  if (filteredBooks.length > 0) {
    res.send(JSON.stringify(filteredBooks, null, 2));
  } else {
    res.status(404).send('No se encontraron libros con el título proporcionado');
  }
});

// Obtener la reseña del libro
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (book && Array.isArray(book.reviews)) {
    res.send(JSON.stringify(book.reviews, null, 2));
  } else {
    res.status(404).send('No se encontraron reseñas para el libro proporcionado');
  }
});

// Agregar una reseña a un libro
public_users.post('/review/:isbn', (req, res) => {
  const { review } = req.body;
  const username = req.body.username || "Anónimo";
  if (!review) {
    return res.status(400).json({ message: "La reseña es requerida" });
  }
  const book = books[req.params.isbn];
  if (book) {
    if (!Array.isArray(book.reviews)) {
      book.reviews = [];
    }
    book.reviews.push({ username, review });
    res.status(201).json({ message: "Reseña agregada exitosamente" });
  } else {
    res.status(404).send('Libro no encontrado');
  }
});

// Eliminar una reseña de un libro
public_users.delete('/review/:isbn/:reviewIndex', (req, res) => {
  const { isbn, reviewIndex } = req.params;
  const book = books[isbn];
  if (book && Array.isArray(book.reviews) && book.reviews.length > reviewIndex) {
    book.reviews.splice(reviewIndex, 1);
    res.status(200).json({ message: "Reseña eliminada exitosamente" });
  } else {
    res.status(404).send('No se pudo encontrar la reseña o el libro especificado');
  }
});

module.exports.general = public_users;

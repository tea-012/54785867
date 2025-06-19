const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// Настройки
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Подключение к MongoDB (используйте бесплатный кластер на mongodb.com)
mongoose.connect('mongodb+srv://username:password@your-cluster.mongodb.net/pet_shelter?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Модель пользователя
const User = mongoose.model('User', {
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' } // 'user' или 'admin'
});

// Генерация JWT токена
const generateToken = (id) => {
  return jwt.sign({ id }, 'your-secret-key', { expiresIn: '30d' });
};

// Middleware для проверки авторизации
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return next();
  
  try {
    const decoded = jwt.verify(token, 'your-secret-key');
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    console.error(error);
    next();
  }
};

// Маршруты
app.get('/', authMiddleware, (req, res) => {
  res.render('index', { user: req.user });
});

// Регистрация
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    
    const token = generateToken(user._id);
    res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка регистрации');
  }
});

// Авторизация
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).send('Неверный email или пароль');
    }
    
    const token = generateToken(user._id);
    res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка авторизации');
  }
});

// Выход
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// Защищённый маршрут
app.get('/profile', authMiddleware, (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.render('profile', { user: req.user });
});

app.listen(3000, () => console.log('Сервер запущен на http://localhost:3000'));
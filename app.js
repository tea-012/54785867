const express = require('express');
const path = require('path');
// 1. Добавляем новые модули в начало файла
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const app = express();

// 2. Настройка подключения к SQLite (после создания app)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

// 3. Модель пользователя
const User = sequelize.define('User', {
  name: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    unique: true
  },
  password: DataTypes.STRING
});

// 4. Инициализация БД (перед маршрутами)
(async () => {
  try {
    await sequelize.sync();
    console.log('База данных подключена');
  } catch (error) {
    console.error('Ошибка подключения к БД:', error);
  }
})();

// Настройка middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Добавляем для работы с JSON

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'), (err) => {
    if (err) {
      console.error('Ошибка при отправке index.html:', err);
      res.status(404).send('Страница не найдена');
    }
  });
});

// 5. Проверка email (новый маршрут)
app.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ where: { email } });
    res.json({ exists: !!user });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка проверки' });
  }
});

// Страница входа
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'auth', 'login.html'));
});

// Страница регистрации
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'auth', 'register.html'));
});

// 6. Обновленный обработчик регистрации
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Проверка существования пользователя
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ error: 'Email уже используется' });
    }
    
    // Хеширование пароля и создание пользователя
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Обновленный обработчик входа
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Неверный пароль' });
    }
    
    res.json({ success: true, name: user.name });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Запуск сервера
app.listen(3000, () => {
  console.log('Сервер работает: http://localhost:3000');
  console.log('Проверьте главную страницу: http://localhost:3000/');
});
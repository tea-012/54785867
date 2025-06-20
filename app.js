const express = require('express');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

const app = express();

// Настройка SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: console.log // Включаем логирование SQL-запросов
});

// Модель пользователя
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true // Добавляем createdAt и updatedAt
});

// Инициализация БД
(async () => {
  try {
    await sequelize.sync({ force: false }); // Не пересоздавать таблицы при каждом запуске
    console.log('✓ База данных подключена');
  } catch (error) {
    console.error('✗ Ошибка подключения к БД:', error);
  }
})();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Маршруты
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Проверка email
app.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ where: { email } });
    res.json({ exists: !!user });
  } catch (error) {
    console.error('Ошибка проверки email:', error);
    res.status(500).json({ error: 'Ошибка проверки' });
  }
});

// Страницы
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'auth', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'auth', 'register.html'));
});

// Регистрация (с логированием)
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    console.log('\n=== Попытка регистрации ===');
    console.log('Данные:', { name, email, password: '******' });

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      console.log('❌ Email уже занят:', email);
      return res.status(400).json({ 
        error: 'EMAIL_EXISTS',
        message: 'Этот email уже зарегистрирован' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email, 
      password: hashedPassword 
    });
    
    console.log('✅ Новый пользователь:', user.email);
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Ошибка регистрации:', error);
    res.status(500).json({ 
      error: 'SERVER_ERROR',
      message: 'Ошибка при регистрации. Попробуйте позже'
    });
  }
});

// Вход (с логированием)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('\n=== Попытка входа ===');
    console.log('Email:', email);

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      return res.status(401).json({ 
        error: 'USER_NOT_FOUND', // Тип ошибки для фронтенда
        message: 'Аккаунт не найден. Проверьте email или зарегистрируйтесь' 
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Неверный пароль для:', email);
      return res.status(401).json({ 
        error: 'WRONG_PASSWORD',
        message: 'Неверный пароль. Попробуйте снова или восстановите доступ'
      });
    }
    
    console.log('✅ Успешный вход:', user.email);
    
    res.json({ 
      success: true, 
      name: user.name,
      email: user.email
    });
    
  } catch (error) {
    console.error('❌ Ошибка входа:', error);
    res.status(500).json({ 
      error: 'SERVER_ERROR',
      message: 'Ошибка сервера. Пожалуйста, попробуйте позже'
    });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n=== Сервер запущен ===`);
  console.log(`http://localhost:${PORT}`);
  console.log(`======================\n`);
});
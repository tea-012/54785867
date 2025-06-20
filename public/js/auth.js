// Удаляем все предыдущие обработчики перед добавлением новых
function clearFormHandlers() {
  document.querySelectorAll('.auth-form').forEach(form => {
    form.replaceWith(form.cloneNode(true));
  });
}

// Показываем уведомление
function showNotification(type, message) {
  // Сначала удаляем старые уведомления
  document.querySelectorAll('.notification').forEach(el => el.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <span class="notification-icon">${type === 'error' ? '❌' : '✅'}</span>
    ${message}
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.5s forwards';
    setTimeout(() => notification.remove(), 500);
  }, 2500);
}

// Инициализация обработчиков
function initAuthForms() {
  // Обработчик для входа
  const loginForm = document.querySelector('.auth-form[action="/login"]');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleAuthRequest(e.target, {
        USER_NOT_FOUND: 'Аккаунт не найден. Зарегистрируйтесь',
        WRONG_PASSWORD: 'Неверный пароль. Попробуйте снова'
      });
    });
  }

  // Обработчик для регистрации
  const registerForm = document.querySelector('.auth-form[action="/register"]');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleAuthRequest(e.target, {
        EMAIL_EXISTS: 'Этот email уже зарегистрирован'
      }, 'Регистрация прошла успешно!', '/login');
    });
  }
}

// Общая функция обработки
async function handleAuthRequest(form, errorMessages, successMessage, redirectUrl = '/') {
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(new FormData(form))
    });
    
    const data = await response.json();
    
    if (data.error) {
      showNotification('error', errorMessages[data.error] || 'Произошла ошибка');
    } else if (data.success) {
      showNotification('success', successMessage || 'Успешно!');
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1500);
    }
  } catch (error) {
    showNotification('error', 'Ошибка соединения с сервером');
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  clearFormHandlers();
  initAuthForms();
});
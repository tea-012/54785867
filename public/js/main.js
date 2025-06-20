document.addEventListener('DOMContentLoaded', () => {
  // Обработка пагинации
  const paginationButtons = document.querySelectorAll('.pagination .btn');
  paginationButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Удаляем активный класс у всех кнопок
      paginationButtons.forEach(b => b.classList.remove('active'));
      
      // Добавляем активный класс текущей кнопке
      if (!e.target.classList.contains('btn')) {
        e.target.parentElement.classList.add('active');
      } else {
        e.target.classList.add('active');
      }
      
      // Здесь можно добавить загрузку данных для страницы
      console.log('Переход на страницу:', e.target.textContent.trim());
    });
  });
});
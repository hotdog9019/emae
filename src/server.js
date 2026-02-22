// или в routes файле

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Маршрут для бронирования
app.post('/api/book', (req, res) => {
  try {
    const { dishId, branchId, date, time, persons, note } = req.body;
    
    // Валидация
    if (!branchId || !date || !time) {
      return res.status(400).json({ message: 'Не все поля заполнены' });
    }

    // Сохранение бронирования (в памяти или БД)
    console.log('Booking:', { dishId, branchId, date, time, persons, note });

    res.json({ 
      id: Date.now(), 
      message: 'Бронь успешно создана',
      dishId,
      branchId,
      date,
      time,
      persons,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Маршрут для блюд
app.get('/api/dishes', (req, res) => {
  res.json([
    // Массив блюд
  ]);
});

// Маршрут для филиалов
app.get('/api/branches', (req, res) => {
  res.json([
    // Массив филиалов
  ]);
});

app.listen(3001, () => console.log('Backend on :3001'));
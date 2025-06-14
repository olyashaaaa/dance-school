const express = require('express');
const cors = require('cors');
const db = require('./database/db'); 
const initDatabase = require('./database/initDB');
const app = express();
const port = 3000;
const fs = require('fs');
const bodyParser = require('body-parser')
const multer = require("multer")
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Создаем папку для загрузок если её нет
if (!fs.existsSync('public/uploads')) {
    fs.mkdirSync('public/uploads', { recursive: true });
}

// Настройка хранилища для загружаемых изображений
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads'); // Папка для сохранения изображений
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Уникальное имя файла
    }
});

const upload = multer({ storage: storage });

// API для аутентификации
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log((username, password))
    if (username === 'admin' && password === 'kon123') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Неверные учетные данные' });
    }
});

// Обработчик POST запроса для сохранения отзыва из админки
app.post('/api/reviews', (req, res) => {
    const { author, text, rating, fio, review_text } = req.body;
    
    // Проверка обязательных полей для админки
    if (author && text) {
        // Данные из админки
        const sql = `INSERT INTO reviews (author, text, rating, date) VALUES (?, ?, ?, ?)`;
        const date = new Date().toISOString();
        
        db.run(sql, [author, text, rating || 5, date], function(err) {
            if (err) {
                console.error('Error saving review:', err);
                return res.status(500).json({ error: 'Failed to save review' });
            }
            
            res.status(201).json({ 
                message: 'Review saved successfully',
                reviewId: this.lastID 
            });
        });
    } else if (fio && review_text) {


        
        // Данные с сайта
        const sql = `INSERT INTO reviews (fio, review_text) VALUES (?, ?)`;
        
        db.run(sql, [fio, review_text], function(err) {
            if (err) {
                console.error('Error saving review:', err);
                return res.status(500).json({ error: 'Failed to save review' });
            }
            
            res.status(201).json({ 
                message: 'Review saved successfully',
                reviewId: this.lastID 
            });
        });
    } else {
        return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }
});

// Обработчик POST запроса для отправки отзыва с сайта
app.post('/submit-review', (req, res) => {
    const { fio, review_text, rating } = req.body;
    
    db.run(
        'INSERT INTO reviews (fio, review_text, rating) VALUES (?, ?, ?)',
        [fio, review_text, rating || 5],
        function(err) {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    error: err.message 
                });
            }
            
            res.json({ 
                success: true, 
                id: this.lastID 
            });
        }
    );
});

// Обработчик POST запроса для отправки заявки с главной страницы
app.post('/submit-application', (req, res) => {
    const { fio, phone, child_name } = req.body;
    
    // Валидация данных
    if (!fio || !phone || !child_name) {
        return res.status(400).json({ 
            success: false, 
            error: 'Все поля обязательны для заполнения' 
        });
    }
    
    db.run(
        'INSERT INTO applications (fio, phone, child_name) VALUES (?, ?, ?)',
        [fio, phone, child_name],
        function(err) {
            if (err) {
                console.error('Error saving application:', err);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Ошибка при сохранении заявки' 
                });
            }
            
            res.json({ 
                success: true, 
                id: this.lastID,
                message: 'Заявка успешно отправлена!' 
            });
        }
    );
});

// Обработчик GET запроса для получения всех отзывов
app.get('/api/reviews', (req, res) => {
    const sql = `SELECT *, 
                 COALESCE(author, fio) as display_author,
                 COALESCE(text, review_text) as display_text,
                 COALESCE(date, created_at) as display_date
                 FROM reviews ORDER BY created_at DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            return res.status(500).json({ error: 'Failed to fetch reviews' });
        }
        
        // Преобразуем данные для админки
        const formattedReviews = rows.map(row => ({
            id: row.id,
            author: row.display_author,
            text: row.display_text,
            rating: row.rating || 5,
            date: row.display_date,
            // Оригинальные поля для совместимости
            fio: row.fio,
            review_text: row.review_text,
            created_at: row.created_at
        }));
        
        res.json(formattedReviews);
    });
});

// Обработчик GET запроса для получения всех заявок
app.get('/api/applications', (req, res) => {
    const sql = `SELECT * FROM applications ORDER BY created_at DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching applications:', err);
            return res.status(500).json({ error: 'Failed to fetch applications' });
        }
        
        res.json(rows);
    });
});

// Удаление отзыва
app.delete('/api/reviews/:id', (req, res) => {
    db.run(
        'DELETE FROM reviews WHERE id = ?',
        [req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        }
    );
});

// Удаление заявки
app.delete('/api/applications/:id', (req, res) => {
    db.run(
        'DELETE FROM applications WHERE id = ?',
        [req.params.id],
        function(err) {
            if (err) {
                console.error('Error deleting application:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        }
    );
});

// Инициализация базы данных перед запуском сервера
async function startServer() {
    try {
        await initDatabase();
        console.log('Database initialized successfully');
        
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}

// Хранение пользователей для проверки авторизации
const users = {
    adminnew: 'kon123' // Логин и пароль
};

// Проверка авторизации
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        res.status(200).json({ message: 'Успешная авторизация' });
    } else {
        res.status(401).json({ message: 'Неверный логин или пароль' });
    }
});

// Обработчик GET запроса для получения списка новостей
app.get('/api/news', (req, res) => {
    const sql = `SELECT * FROM news ORDER BY created_at DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching news:', err);
            return res.status(500).json({ error: 'Failed to fetch news' });
        }
        
        res.json(rows);
    });
});

// Обработчик GET запроса для получения отдельной новости по ID
app.get('/api/news/:id', (req, res) => {
    const sql = `SELECT * FROM news WHERE id = ?`;
    
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            console.error('Error fetching news:', err);
            return res.status(500).json({ error: 'Failed to fetch news' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'News not found' });
        }
        
        res.json(row);
    });
});

// Удаление новости
app.delete('/api/news/:id', (req, res) => {
    db.run(
        'DELETE FROM news WHERE id = ?',
        [req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ changes: this.changes });
        }
    );
});

// Публикация новости (обновленная версия)
app.post('/api/news', upload.array('gallery-images'), (req, res) => {
    const { title, eventDate, eventLocation, content, highlights, impressions, status } = req.body;
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    // Сохранение новости в базу данных
    const sql = `INSERT INTO news (title, event_date, event_location, content, highlights, impressions, images, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const createdAt = new Date().toISOString();
    
    db.run(sql, [title, eventDate, eventLocation, content, highlights, impressions, JSON.stringify(images), status || 'published', createdAt], function(err) {
        if (err) {
            console.error('Error saving news:', err);
            return res.status(500).json({ error: 'Failed to save news' });
        }
        
        res.status(201).json({ 
            message: 'News saved successfully',
            newsId: this.lastID 
        });
    });
});

startServer(kontrastorenburg.ru);
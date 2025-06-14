const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Создаем абсолютный путь к файлу базы данных
const DB_PATH = path.join(__dirname, 'reviews.db');

// Remove the directory creation logic since we're already in the database directory
// const dbDir = path.dirname(DB_PATH);
// if (!fs.existsSync(dbDir)) {
//     fs.mkdirSync(dbDir, { recursive: true });
// }

const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
        console.error('Database path:', DB_PATH);
        console.error('Current working directory:', process.cwd());
    } else {
        console.log('Connected to SQLite database at:', DB_PATH);
    }
});

// Обработка закрытия базы данных при завершении процесса
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

module.exports = db;





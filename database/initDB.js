const db = require('./db');

function initDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS reviews (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    fio TEXT,
                    review_text TEXT,
                    author TEXT,
                    text TEXT,
                    rating INTEGER DEFAULT 5,
                    date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating reviews table:', err);
                    reject(err);
                    return;
                }
                console.log('Table "reviews" created');
                
                db.run(`
                    CREATE TABLE IF NOT EXISTS news (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        event_date DATE,
                        event_location TEXT,
                        content TEXT NOT NULL,
                        highlights TEXT,
                        impressions TEXT,
                        images TEXT,
                        status TEXT DEFAULT 'published',
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        console.error('Error creating news table:', err);
                        reject(err);
                        return;
                    }
                    console.log('Table "news" created');
                    
                    db.run(`
                        CREATE TABLE IF NOT EXISTS applications (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            fio TEXT NOT NULL,
                            phone TEXT NOT NULL,
                            child_name TEXT NOT NULL,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    `, (err) => {
                        if (err) {
                            console.error('Error creating applications table:', err);
                            reject(err);
                        } else {
                            console.log('Table "applications" created');
                            resolve();
                        }
                    });
                });

            });

            
        });
    });
}

module.exports = initDatabase;





import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import storiesRoutes from './routes/stories.js';
import usersRoutes from './routes/users.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Database connection setup using built-in node:sqlite
const dbPath = path.join(__dirname, 'sprint_tracker.db');
const db = new DatabaseSync(dbPath);
console.log('Connected to SQLite database (node:sqlite)');

// Attach db to request object
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Routes
app.use('/api', authRoutes);
app.use('/api', storiesRoutes);
app.use('/api', usersRoutes);

app.get('/api/teams', (req, res) => {
    try {
        const stmt = req.db.prepare('SELECT * FROM teams');
        const rows = stmt.all();
        res.json(rows);
    } catch (error) {
        console.error('Teams fetch error', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import storiesRoutes from './routes/stories.js';
import usersRoutes from './routes/users.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { execSync } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://imatanury.github.io',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
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

// Health check — must be unauthenticated and respond instantly
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// Routes
app.use('/api', authRoutes);
app.use('/api', storiesRoutes);
app.use('/api', usersRoutes);

app.get('/api/teams', (req, res, next) => {
    try {
        const stmt = req.db.prepare('SELECT * FROM teams');
        const rows = stmt.all();
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

// Health check
app.get('/api/health', (req, res, next) => {
    try {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

// MUST be the last app.use() call — after all routes
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error.';
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;

async function initDb() {
    try {
        const row = db.prepare('SELECT COUNT(*) as count FROM users').get();
        if (row.count === 0) {
            console.log('Database empty. Running seed on startup...');
            execSync('npm run seed', { stdio: 'inherit' });
            console.log('Database seeded on startup.');
        }
    } catch (err) {
        console.log('Schema might be missing. Running seed on startup...');
        execSync('npm run seed', { stdio: 'inherit' });
        console.log('Database seeded on startup.');
    }
}

await initDb();
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Self-ping after 10 seconds to warm up DB connection and confirm health
    if (process.env.NODE_ENV === 'production') {
        setTimeout(async () => {
            try {
                const url = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
                await fetch(`${url}/health`);
                console.log('Startup self-ping successful.');
            } catch {
                console.log('Startup self-ping failed — server may still be initializing.');
            }
        }, 10000);
    }
});

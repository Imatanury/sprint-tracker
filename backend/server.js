import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import storiesRoutes from './routes/stories.js';
import usersRoutes from './routes/users.js';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Database connection setup using PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sprint_tracker',
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Attach db pool to request object
app.use((req, res, next) => {
    req.db = pool;
    next();
});

// Routes
app.use('/api', authRoutes);
app.use('/api', storiesRoutes);
app.use('/api', usersRoutes);

app.get('/api/teams', async (req, res) => {
    try {
        const { rows } = await req.db.query('SELECT * FROM teams');
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

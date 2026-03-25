import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_for_development_only';

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const stmt = req.db.prepare('SELECT * FROM users WHERE username = ?');
        const user = stmt.get(username);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, team_id: user.team_id },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token, user: { id: user.id, username: user.username, role: user.role, team_id: user.team_id } });
    } catch (error) {
        console.error('Login error', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Middleware to verify JWT
export const verifyAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

router.get('/me', verifyAuth, (req, res) => {
    try {
        if (req.user.team_id) {
            const stmt = req.db.prepare('SELECT * FROM teams WHERE id = ?');
            const team = stmt.get(req.user.team_id);
            return res.json({ user: req.user, team });
        }
        res.json({ user: req.user });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching user details' });
    }
});

export default router;

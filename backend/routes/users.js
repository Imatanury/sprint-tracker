import express from 'express';
import bcrypt from 'bcryptjs';
import { verifyAuth } from './auth.js';

const router = express.Router();

// Middleware: Admin only
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    next();
};

// GET /api/users — list all users (Admin only)
router.get('/users', verifyAuth, adminOnly, (req, res) => {
    try {
        const stmt = req.db.prepare(`
            SELECT u.id, u.username, u.role, u.team_id, t.name as team_name
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            ORDER BY u.role, u.username
        `);
        const rows = stmt.all();
        res.json(rows);
    } catch (error) {
        console.error('Users fetch error', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// POST /api/users — create a new user (Admin only)
router.post('/users', verifyAuth, adminOnly, async (req, res) => {
    try {
        const { username, password, role, team_id } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ message: 'username, password, and role are required' });
        }

        if (!['Admin', 'Lead', 'Developer'].includes(role)) {
            return res.status(400).json({ message: 'role must be Admin, Lead, or Developer' });
        }

        if (role === 'Developer' && !team_id) {
            return res.status(400).json({ message: 'Developers must be assigned to a team' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const stmt = req.db.prepare(
            `INSERT INTO users (username, password_hash, role, team_id) VALUES (?, ?, ?, ?)`
        );
        const result = stmt.run(username, hash, role, team_id || null);

        res.status(201).json({
            id: result.lastInsertRowid,
            username,
            role,
            team_id: team_id || null
        });
    } catch (error) {
        if (error.message?.includes('UNIQUE')) {
            return res.status(409).json({ message: 'Username already exists' });
        }
        console.error('Create user error', error);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// DELETE /api/users/:id — remove a user (Admin only)
router.delete('/users/:id', verifyAuth, adminOnly, (req, res) => {
    try {
        const userId = parseInt(req.params.id, 10);

        // Prevent self-deletion
        if (userId === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const stmt = req.db.prepare('DELETE FROM users WHERE id = ?');
        const result = stmt.run(userId);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error', error);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// PATCH /api/users/me/password — change own password
router.patch('/users/me/password', verifyAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'New password must be different from current password' });
        }

        const stmt = req.db.prepare('SELECT password_hash FROM users WHERE id = ?');
        const user = stmt.get(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        const updateStmt = req.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        updateStmt.run(newHash, req.user.id);

        res.json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Change password error', error);
        res.status(500).json({ message: 'Error updating password' });
    }
});

// PATCH /api/users/:id/password — admin force-reset password
router.patch('/users/:id/password', verifyAuth, adminOnly, async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const targetId = parseInt(req.params.id, 10);
        
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const stmt = req.db.prepare('SELECT id FROM users WHERE id = ?');
        const user = stmt.get(targetId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(newPassword, salt);

        const updateStmt = req.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        updateStmt.run(newHash, targetId);

        res.json({ message: 'User password has been reset successfully.' });
    } catch (error) {
        console.error('Reset password error', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
});

export default router;

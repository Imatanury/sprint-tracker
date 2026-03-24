import express from 'express';
import { verifyAuth } from './auth.js';

const router = express.Router();

// GET /api/sprints — distinct sprint IDs for filter dropdowns
router.get('/sprints', verifyAuth, (req, res) => {
    try {
        const stmt = req.db.prepare('SELECT DISTINCT sprint_id FROM user_stories ORDER BY sprint_id DESC');
        const rows = stmt.all();
        res.json(rows.map(r => r.sprint_id));
    } catch (error) {
        console.error('Sprints fetch error', error);
        res.status(500).json({ message: 'Error fetching sprints' });
    }
});

// GET /api/stories — role-scoped stories with optional filtering
router.get('/stories', verifyAuth, (req, res) => {
    try {
        const { role, team_id, username } = req.user;
        const { team_ids, sprint_id } = req.query;

        let query = `
      SELECT us.*, t.name as team_name, t.area_path 
      FROM user_stories us
      JOIN teams t ON us.team_id = t.id
      WHERE 1=1
    `;
        const values = [];

        if (role === 'Admin') {
            // Full access — apply optional team_ids filter from query params
            if (team_ids) {
                const ids = team_ids.split(',').map(Number).filter(Boolean);
                if (ids.length > 0) {
                    const placeholders = ids.map(() => '?').join(',');
                    query += ` AND us.team_id IN (${placeholders})`;
                    values.push(...ids);
                }
            }
        } else if (role === 'Lead') {
            // Scoped to Lead's own team — team_ids query param is ignored for security
            query += ` AND us.team_id = ?`;
            values.push(team_id);
        } else if (role === 'Developer') {
            // Scoped to stories where assigned_to matches the developer's username
            query += ` AND us.assigned_to = ?`;
            values.push(username);
        } else {
            return res.status(403).json({ message: 'Forbidden: unrecognised role' });
        }

        // Sprint filter — available to Admin and Lead (Developer has no filter UI)
        if (sprint_id && role !== 'Developer') {
            query += ` AND us.sprint_id = ?`;
            values.push(sprint_id);
        }

        query += ' ORDER BY us.updated_at DESC';

        const stmt = req.db.prepare(query);
        const rows = stmt.all(...values);
        res.json(rows);
    } catch (error) {
        console.error('Fetch stories error', error);
        res.status(500).json({ message: 'Error fetching stories' });
    }
});

// POST /api/stories — create or update a story
router.post('/stories', verifyAuth, (req, res) => {
    try {
        if (req.user.role === 'Developer') {
            // Developers can only submit for their own team
            req.body.team_id = req.user.team_id;
        }

        const {
            story_id, sprint_id, team_id, work_item_type,
            title, assigned_to, state, tags,
            test_plan_url, test_run_url, status_remarks
        } = req.body;

        if (!story_id || !sprint_id || !team_id || !work_item_type || !title) {
            return res.status(400).json({ message: 'Missing required fields: story_id, sprint_id, team_id, work_item_type, title' });
        }

        const query = `
      INSERT INTO user_stories (
        story_id, sprint_id, team_id, work_item_type,
        title, assigned_to, state, tags,
        test_plan_url, test_run_url, status_remarks,
        updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
      )
      ON CONFLICT(story_id) DO UPDATE SET
        sprint_id = excluded.sprint_id,
        team_id = excluded.team_id,
        work_item_type = excluded.work_item_type,
        title = excluded.title,
        assigned_to = excluded.assigned_to,
        state = excluded.state,
        tags = excluded.tags,
        test_plan_url = excluded.test_plan_url,
        test_run_url = excluded.test_run_url,
        status_remarks = excluded.status_remarks,
        updated_at = CURRENT_TIMESTAMP;
    `;

        const stmtValues = [
            story_id, sprint_id, team_id, work_item_type,
            title, assigned_to || null, state || null, tags || null,
            test_plan_url || null, test_run_url || null, status_remarks || null
        ];

        const stmt = req.db.prepare(query);
        stmt.run(...stmtValues);

        const getStmt = req.db.prepare('SELECT * FROM user_stories WHERE story_id = ?');
        const newStory = getStmt.get(story_id);

        res.status(201).json(newStory);
    } catch (error) {
        console.error('Upsert story error', error);
        res.status(500).json({ message: 'Error saving story details' });
    }
});

export default router;

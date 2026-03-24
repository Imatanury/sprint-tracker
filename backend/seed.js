import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sprint_tracker',
    });

    try {
        console.log('Connected to PostgreSQL database');

        // Run schema DDL
        const schemaPath = path.join(__dirname, 'db_schema.sql');
        const sqlScript = fs.readFileSync(schemaPath, 'utf8');
        console.log('Executing DDL script...');
        await pool.query(sqlScript);
        console.log('Schema created successfully.');

        // ---------- Seed Users ----------
        const salt = await bcrypt.genSalt(10);

        // Admin user (no team)
        const adminHash = await bcrypt.hash('admin123', salt);
        await pool.query(
            `INSERT INTO users (username, password_hash, role, team_id) VALUES ($1, $2, 'Admin', NULL) ON CONFLICT (username) DO NOTHING`,
            ['admin', adminHash]
        );
        console.log('Seeded admin user  (admin / admin123)');

        // One Lead per team
        const { rows: teams } = await pool.query('SELECT id, name FROM teams');
        for (const team of teams) {
            const leadUser = `lead_${team.name.toLowerCase()}`;
            const leadHash = await bcrypt.hash('lead123', salt);
            await pool.query(
                `INSERT INTO users (username, password_hash, role, team_id) VALUES ($1, $2, 'Lead', $3) ON CONFLICT (username) DO NOTHING`,
                [leadUser, leadHash, team.id]
            );
            console.log(`Seeded Lead: ${leadUser} / lead123  (team: ${team.name})`);
        }

        // One Developer per team
        for (const team of teams) {
            const devUser = `dev_${team.name.toLowerCase()}`;
            const devHash = await bcrypt.hash('dev123', salt);
            await pool.query(
                `INSERT INTO users (username, password_hash, role, team_id) VALUES ($1, $2, 'Developer', $3) ON CONFLICT (username) DO NOTHING`,
                [devUser, devHash, team.id]
            );
            console.log(`Seeded Developer: ${devUser} / dev123  (team: ${team.name})`);
        }

        // ---------- Seed Sample Stories ----------
        const sampleStories = [
            { story_id: 205185, sprint_id: 'Sprint 26-04', team_id: 1, work_item_type: 'User Story', title: 'Implement dark mode toggle', assigned_to: 'dev_philomath', state: 'Active', tags: 'UI,Theme', status_remarks: 'In progress — awaiting design review' },
            { story_id: 205200, sprint_id: 'Sprint 26-04', team_id: 2, work_item_type: 'Issue', title: 'Fix date picker timezone offset', assigned_to: 'dev_zesture', state: 'Resolved', tags: 'Bug,DatePicker', status_remarks: 'Fixed and verified in QA' },
            { story_id: 205210, sprint_id: 'Sprint 26-04', team_id: 3, work_item_type: 'Feature', title: 'Add batch upload for CSV import', assigned_to: 'dev_titans', state: 'New', tags: 'Feature,Import', status_remarks: 'Pending sprint planning' },
            { story_id: 205220, sprint_id: 'Sprint 26-03', team_id: 4, work_item_type: 'User Story', title: 'User profile settings page', assigned_to: 'dev_alpha', state: 'Closed', tags: 'Profile,Settings', status_remarks: 'Completed and deployed' },
            { story_id: 205230, sprint_id: 'Sprint 26-03', team_id: 5, work_item_type: 'Issue', title: 'Memory leak in real-time dashboard', assigned_to: 'dev_artisans', state: 'Active', tags: 'Performance,Bug', status_remarks: 'Under investigation' },
            { story_id: 205240, sprint_id: 'Sprint 26-04', team_id: 1, work_item_type: 'User Story', title: 'Notification preferences API', assigned_to: 'dev_philomath', state: 'New', tags: 'API,Notifications', status_remarks: '' },
        ];

        const storyQuery = `
            INSERT INTO user_stories
            (story_id, sprint_id, team_id, work_item_type, title, assigned_to, state, tags, status_remarks)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (story_id) DO NOTHING
        `;

        for (const s of sampleStories) {
            await pool.query(storyQuery, [
                s.story_id, s.sprint_id, s.team_id, s.work_item_type, s.title, s.assigned_to, s.state, s.tags, s.status_remarks
            ]);
        }
        console.log(`Seeded ${sampleStories.length} sample user stories.`);

        console.log('\n✅ Database seed completed successfully.');
    } catch (error) {
        console.error('Error setting up database schema:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

setupDatabase();

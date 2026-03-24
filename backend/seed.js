import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
    try {
        const dbPath = path.join(__dirname, 'sprint_tracker.db');

        // Delete existing DB so we start fresh
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
            console.log('Removed old database file.');
        }

        const db = new DatabaseSync(dbPath);
        console.log('Connected to SQLite database at', dbPath);

        // Run schema DDL
        const schemaPath = path.join(__dirname, 'db_schema.sql');
        const sqlScript = fs.readFileSync(schemaPath, 'utf8');
        console.log('Executing DDL script...');
        db.exec(sqlScript);
        console.log('Schema created successfully.');

        // ---------- Seed Users ----------
        const salt = await bcrypt.genSalt(10);

        // Admin user  (no team)
        const adminHash = await bcrypt.hash('admin123', salt);
        db.prepare(
            `INSERT OR IGNORE INTO users (username, password_hash, role, team_id) VALUES (?, ?, 'Admin', NULL)`
        ).run(adminHash.length ? 'admin' : 'admin', adminHash);
        console.log('Seeded admin user  (admin / admin123)');

        // One Lead per team
        const teams = db.prepare('SELECT id, name FROM teams').all();
        for (const team of teams) {
            const leadUser = `lead_${team.name.toLowerCase()}`;
            const leadHash = await bcrypt.hash('lead123', salt);
            db.prepare(
                `INSERT OR IGNORE INTO users (username, password_hash, role, team_id) VALUES (?, ?, 'Lead', ?)`
            ).run(leadUser, leadHash, team.id);
            console.log(`Seeded Lead: ${leadUser} / lead123  (team: ${team.name})`);
        }

        // One Developer per team
        for (const team of teams) {
            const devUser = `dev_${team.name.toLowerCase()}`;
            const devHash = await bcrypt.hash('dev123', salt);
            db.prepare(
                `INSERT OR IGNORE INTO users (username, password_hash, role, team_id) VALUES (?, ?, 'Developer', ?)`
            ).run(devUser, devHash, team.id);
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

        const storyStmt = db.prepare(`
            INSERT OR IGNORE INTO user_stories
            (story_id, sprint_id, team_id, work_item_type, title, assigned_to, state, tags, status_remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const s of sampleStories) {
            storyStmt.run(s.story_id, s.sprint_id, s.team_id, s.work_item_type, s.title, s.assigned_to, s.state, s.tags, s.status_remarks);
        }
        console.log(`Seeded ${sampleStories.length} sample user stories.`);

        db.close();
        console.log('\n✅ Database seed completed successfully.');
    } catch (error) {
        console.error('Error setting up database schema:', error);
        process.exit(1);
    }
}

setupDatabase();

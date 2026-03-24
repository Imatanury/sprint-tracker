// one-time-setup.js — Run seed then hand off to the regular server
// This file is used for the initial production deployment only.
import { spawn } from 'child_process';

console.log('=== Running seed script ===');

const seed = spawn('node', ['seed.js'], { stdio: 'inherit' });

seed.on('close', (code) => {
    if (code !== 0) {
        console.error(`Seed exited with code ${code}`);
        process.exit(code);
    }
    console.log('=== Seed complete. Starting server ===');
    const server = spawn('node', ['server.js'], { stdio: 'inherit' });
    server.on('close', (c) => process.exit(c));
});

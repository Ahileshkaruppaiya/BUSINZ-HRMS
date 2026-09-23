import { app } from '../src/app.js';
import type { Server } from 'http';

let server: Server;

export async function setup() {
  // Check if server is already running externally
  try {
    const res = await fetch('http://localhost:8000/health');
    if (res.ok) {
      return;
    }
  } catch {
    // Start global server instance on port 8000
    await new Promise<void>((resolve) => {
      server = app.listen(8000, () => {
        console.log('Vitest global test server listening on http://localhost:8000');
        resolve();
      });
    });
  }
}

export async function teardown() {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

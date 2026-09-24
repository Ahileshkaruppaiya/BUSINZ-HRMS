// Root server.js entry point for Plesk Node.js / IISNode deployment
import('./backend/dist/server.js').catch((err) => {
  console.error('Fatal: Failed to bootstrap HRMS backend server:', err);
  process.exit(1);
});

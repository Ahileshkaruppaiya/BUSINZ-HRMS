// app.js (CommonJS entry point for IISNode / Plesk)
(async () => {
  try {
    await import('./backend/dist/server.js');
  } catch (err) {
    console.error('Fatal: Failed to bootstrap HRMS backend server:', err);
  }
})();

module.exports = {
  staticPageGenerationTimeout: 300,
  // Build with a single worker so the Notion request throttle in lib/notion.js
  // applies to every page instead of one budget per worker process.
  experimental: {
    cpus: 1,
  },
};

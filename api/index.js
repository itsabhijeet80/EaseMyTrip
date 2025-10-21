import "dotenv/config";
import express from "express";
import { registerRoutes } from "../dist/index.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes
let server;
(async () => {
  server = await registerRoutes(app);
})();

// Error handler
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Export for Vercel serverless
export default app;


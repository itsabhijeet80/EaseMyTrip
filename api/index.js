import "dotenv/config";
import express from "express";
import { registerRoutes } from "../dist/api-handler.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes synchronously
let routesInitialized = false;
let initPromise = null;

const initializeRoutes = async () => {
  if (!routesInitialized && !initPromise) {
    initPromise = registerRoutes(app).then(() => {
      routesInitialized = true;
    });
  }
  return initPromise;
};

// Middleware to ensure routes are initialized before handling requests
app.use(async (req, res, next) => {
  if (!routesInitialized) {
    await initializeRoutes();
  }
  next();
});

// Error handler
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Error:", err);
  res.status(status).json({ message });
});

// Export for Vercel serverless
export default app;


import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodroutes.js";
import userRouter from "./routes/userRoutes.js";
import cartRouter from "./routes/cartRoute.js";
import "dotenv/config";
import orderRouter from "./routes/orderRoute.js";

// app config
const app = express();
const port = process.env.PORT || 4000;

const normalizeOrigin = (origin = "") => String(origin).trim().replace(/\/$/, "");
const splitOrigins = (value = "") =>
  String(value)
    .split(",")
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);

const allowedOrigins = [
  ...splitOrigins(process.env.CORS_ORIGINS),
  ...splitOrigins(process.env.FRONTEND_URL),
  ...splitOrigins(process.env.ADMIN_URL),
  "https://food-del-ten-blue.vercel.app",
  "https://food-del-admin-navy.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "https://food-del-admin.vercel.app",
];
const normalizedAllowedOrigins = new Set(
  allowedOrigins.map((allowedOrigin) => normalizeOrigin(allowedOrigin)),
);

// middleware
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      const normalizedOrigin = normalizeOrigin(origin || "");
      if (!origin || normalizedAllowedOrigins.has(normalizedOrigin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  }),
);

//DB Connection
connectDB();

//api endpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`);
});

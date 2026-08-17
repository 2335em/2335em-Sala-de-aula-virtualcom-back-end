import express from "express";
import cors from "cors";
import 'dotenv/config';
import authRoutes from "./routes/auth.js";
import classRoutes from "./routes/classes.js";
import materialRoutes from "./routes/materials.js";
import announcementRoutes from "./routes/announcements.js";

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/announcements", announcementRoutes);

app.use("/uploads", express.static("uploads"));
app.use("/assets", express.static("../assets"));

app.use((req, res) => {
  res.status(404).json({ message: "Rota não encontrada." });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

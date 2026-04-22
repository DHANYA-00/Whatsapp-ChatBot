import express from "express";
import dotenv from "dotenv";
import router from "./router.js";

dotenv.config();

const app = express();

app.use(express.json());

// Routes
app.use("/api", router);

// Health check
app.get("/", (req, res) => {
  res.send("Server running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
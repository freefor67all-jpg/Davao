import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const API_KEY = process.env.ANTHROPIC_API_KEY;

app.post("/api/chat", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY." });
  }
  try {
    const { messages } = req.body;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages,
      }),
    });
    const data = await response.json();
    const reply = data?.content?.find((b) => b.type === "text")?.text || "";
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reach the AI." });
  }
});

// Serve the built frontend
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`De Venom running on port ${PORT}`));

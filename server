
const express = require("express");
const path = require("path");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const app = express();
const PORT = 3000;

let uploadedPdfText = "";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Please upload a PDF file."));
    }
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (req, res) => {
  res.json({ message: "StudyMate AI backend is working!" });
});

app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please select a PDF." });
    }

    const result = await pdfParse(req.file.buffer);
    uploadedPdfText = result.text;

    if (!uploadedPdfText.trim()) {
      uploadedPdfText = "";
      return res.status(400).json({
        error: "No readable text found in this PDF."
      });
    }

    res.json({
      message: "PDF uploaded and read successfully!",
      pages: result.numpages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not read this PDF." });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const question = req.body.question;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Please enter a question." });
    }

    const context = uploadedPdfText
      ? "Answer using the following uploaded PDF content. If the answer is not in the PDF, say so.\n\nPDF CONTENT:\n" +
        uploadedPdfText.slice(0, 30000)
      : "Answer the user's question clearly and simply.";

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma3:270m",
        messages: [
          { role: "system", content: context },
          { role: "user", content: question }
        ],
        stream: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data.error || "AI request failed."
      });
    }

    res.json({ answer: data.message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Could not connect to Ollama. Make sure Ollama is running."
    });
  }
});
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  if (req.path === "/api/upload") {
    return res.status(400).json({
      error: err.message || "PDF upload failed."
    });
  }

  res.status(500).json({ error: error.message });
  
});
app.listen(PORT, () => {
  console.log("StudyMate AI running on port " + PORT);
});

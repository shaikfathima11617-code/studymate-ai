const express = require("express");
const path = require("path");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const app = express();
const PORT = process.env.PORT || 3000;

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
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    const context = uploadedPdfText
      ? "Answer using the uploaded PDF. If the answer is not in it, say so.\n\nPDF CONTENT:\n" +
        uploadedPdfText.slice(0, 30000)
      : "Answer the user's question clearly and simply.";

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is missing in server settings."
      });
    }

    const response = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
  {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: context }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: question }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(500).json({
        error: data.error?.message || "Gemini request failed."
      });
    }

    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "No answer was returned.";

    res.json({ answer });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      error: "Could not connect to Gemini. Please try again."
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

  res.status(500).json({
    error: err.message || "Something went wrong."
  });
});

app.listen(PORT, () => {
  console.log("StudyMate AI running on port " + PORT);
});
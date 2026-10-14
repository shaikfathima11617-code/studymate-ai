
const chatForm = document.querySelector("form");
const questionInput = document.querySelector("textarea");
const chatMessages = document.getElementById("chatMessages");
const pdfFile = document.getElementById("pdfFile");
const fileName = document.getElementById("fileName");
const sendButton = document.getElementById("sendButton");

let pdfUploaded = false;

if (pdfFile && fileName) {
  pdfFile.addEventListener("change", async () => {
    const file = pdfFile.files[0];

    pdfUploaded = false;

    if (!file) {
      fileName.textContent = "No file selected";
      return;
    }

    fileName.textContent = "Uploading " + file.name + "...";

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "PDF upload failed.");
      }

      pdfUploaded = true;
      fileName.textContent = file.name + " — PDF ready!";
      addMessage("StudyMate AI", data.message);
    } catch (error) {
      fileName.textContent = "PDF upload failed";
      addMessage("StudyMate AI", error.message);
      console.error(error);
    }
  });
}

if (chatForm && questionInput && chatMessages) {
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const question = questionInput.value.trim();
    if (!question) return;

    addMessage("You", question);
    questionInput.value = "";

    if (sendButton) sendButton.disabled = true;

    const loading = addMessage("StudyMate AI", "Thinking...");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      loading.textContent = "StudyMate AI: " + data.answer;
    } catch (error) {
      loading.textContent = "StudyMate AI: " + error.message;
      console.error(error);
    } finally {
      if (sendButton) sendButton.disabled = false;
    }
  });
}

function addMessage(sender, message) {
  const element = document.createElement("p");
  element.textContent = sender + ": " + message;
  chatMessages.appendChild(element);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return element;
}

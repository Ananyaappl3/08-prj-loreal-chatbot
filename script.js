/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

// When using a Cloudflare Worker, set WORKER_URL to your worker's public URL.
// The worker should hold the OpenAI API key server-side and forward the request.
const WORKER_URL = "https://ananya-cloudflare-first.asbasark.workers.dev/";
const TEMPERATURE = 0.7; // adjust creativity
const MAX_TOKENS = 400; // adjust response length

async function main(userText) {
  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that works at the L'Oreal company and has a deep knowledge of all of its products. Since you are an official assistant, you always provide accurate information based on L'Oreal's product catalog. If a user asks about a product, provide detailed information including its benefits, ingredients, and usage instructions. If you do not know the answer, politely inform the user that you do not have that information rather than making up an answer. Always maintain a professional and friendly tone. Do not answer questions that are not related to L'Oreal products, and instead politely refuse to answer.",
          },
          { role: "user", content: userText },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Worker error: ${response.status} ${errText}`);
    }

    const data = await response.json();

    const assistantText = data.choices?.[0]?.message?.content ?? "";
    appendMessage(assistantText, "ai");
  } catch (err) {
    console.error(err);
    appendMessage(
      "Error: " + (err.message || "Failed to contact worker"),
      "error"
    );
  } finally {
    // re-enable UI
    if (sendBtn) sendBtn.disabled = false;
  }
}
// Set initial message
chatWindow.innerHTML = "👋 Hello! How can I help you today?";

/* Handle form submit */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  // Disable send button while awaiting response
  if (sendBtn) sendBtn.disabled = true;

  // Show user's message in the chat window
  appendMessage(text, "user");
  userInput.value = "";

  // Show temporary status message
  appendMessage("Connecting to the assistant…", "status");

  main(text);
});

// Helper to append messages with optional role classes and render markdown for AI
function appendMessage(text, role) {
  // remove any existing status messages when adding new ones
  if (role === "ai") {
    // remove last 'status' message if present
    const lastStatus = chatWindow.querySelector(".msg.status");
    if (lastStatus) lastStatus.remove();
  }

  const el = document.createElement("div");
  el.className = "msg " + (role || "ai");
  if (role === "ai") {
    el.innerHTML = renderBasicMarkdown(text);
  } else {
    el.textContent = text;
  }
  chatWindow.appendChild(el);
  // scroll to bottom
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- Helper: very small, safe markdown renderer for bold/italics ---
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBasicMarkdown(md) {
  if (!md) return "";
  // 1) Escape HTML to prevent XSS
  let out = escapeHtml(md);

  // 2) Convert bold **text** and __text__ -> <strong>
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // 3) Convert italics *text* and _text_ -> <em>
  // Do this after bold so that **something** isn't partially matched as *something*
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  out = out.replace(/_(.+?)_/g, "<em>$1</em>");

  return out;
}

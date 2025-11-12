/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

async function main() {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "user", content: userInput.value },
        {
          role: "system",
          content:
            "You are a helpful assistant that works at the L'Oreal company and has a deep knowledge of all of its products. Since you are an official assistant, you always provide accurate information based on L'Oreal's product catalog. If a user asks about a product, provide detailed information including its benefits, ingredients, and usage instructions. If you do not know the answer, politely inform the user that you do not have that information rather than making up an answer. Always maintain a professional and friendly tone. Do not answer questions that are not related to L'Oreal products, and instead politely refuse to answer.",
        },
      ],
    }),
  });

  const data = await response.json();
  // Render the assistant response with basic Markdown support (bold/italics).
  // We escape HTML first to prevent XSS, then convert **bold** and *italic* markers.
  const assistantText = data.choices?.[0]?.message?.content ?? "";
  chatWindow.innerHTML = renderBasicMarkdown(assistantText);
}
// Set initial message
chatWindow.innerHTML = "👋 Hello! How can I help you today?";

/* Handle form submit */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // When using Cloudflare, you'll need to POST a `messages` array in the body,
  // and handle the response using: data.choices[0].message.content

  // Show message
  chatWindow.innerHTML = "Connecting to the OpenAI API for a response!";
  main();
});

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

(function () {
  const config = window.VetChatbotConfig || {};

  const container = document.createElement("div");
  container.id = "vet-chatbot-root";
  document.body.appendChild(container);
  const scriptTag = document.currentScript;
  const backendDomain = new URL(scriptTag.src).origin;

  const style = document.createElement("style");
  style.innerHTML = `
  #vet-chatbot-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #4f46e5;
    color: white;
    font-size: 24px;
    border: none;
    cursor: pointer;
    z-index: 999999;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  }

  #vet-chat-window {
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 360px;
    height: 580px;
    background: white;
    border-radius: 18px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    display: none;
    flex-direction: column;
    overflow: hidden;
    z-index: 999999;
    font-family: Arial, sans-serif;
  }

  #vet-chat-header {
    background: #4f46e5;
    color: white;
    padding: 14px;
    font-weight: bold;
  }

  #vet-chat-messages {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    background: #f9fafb;
    font-size: 14px;
  }

  #vet-chat-input {
    display: flex;
    border-top: 1px solid #eee;
  }

  #vet-chat-input input {
    flex: 1;
    padding: 10px;
    border: none;
    outline: none;
  }

  #vet-chat-input button {
    background: #4f46e5;
    color: white;
    border: none;
    padding: 0 16px;
    cursor: pointer;
  }
`;
  document.head.appendChild(style);

  container.innerHTML = `
    <button id="vet-chatbot-button">💬</button>

    <div id="vet-chat-window">
      <div id="vet-chat-header">Vet Assistant</div>
      <div id="vet-chat-messages"></div>
      <div id="vet-chat-input">
        <input placeholder="Ask about your pet..." />
        <button>Send</button>
      </div>
    </div>
  `;

  const button = document.getElementById("vet-chatbot-button");
  const windowEl = document.getElementById("vet-chat-window");
  const input = container.querySelector("input");
  const sendBtn = container.querySelector("button:last-child");
  const messages = document.getElementById("vet-chat-messages");

  let sessionId = localStorage.getItem("vet-session") || crypto.randomUUID();
  localStorage.setItem("vet-session", sessionId);

  button.onclick = () => {
    windowEl.style.display =
      windowEl.style.display === "flex" ? "none" : "flex";
  };

  function addMessage(text, sender) {
    const div = document.createElement("div");
    div.style.margin = "6px 0";
    div.style.textAlign = sender === "user" ? "right" : "left";
    div.innerHTML = `<span style="
      display:inline-block;
      padding:8px 12px;
      border-radius:12px;
      background:${sender === "user" ? "#4f46e5" : "#e5e7eb"};
      color:${sender === "user" ? "white" : "black"};
    ">${text}</span>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  addMessage("Hi 👋 I'm your Vet Assistant!", "bot");

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    try {
      const res = await fetch(`${backendDomain}/api/message/addMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId,
          context: config,
        }),
      });

      const data = await res.json();
      addMessage(data.text || "No response", "bot");
    } catch {
      addMessage("Server error", "bot");
    }
  }

  sendBtn.onclick = sendMessage;
  input.addEventListener("keydown", (e) => e.key === "Enter" && sendMessage());
})();

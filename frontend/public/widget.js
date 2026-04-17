(function () {
  "use strict";

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName("script");
    return s[s.length - 1];
  })();

  var widgetKey = script.getAttribute("data-widget-key");
  if (!widgetKey) {
    console.error("[PumAI Widget] Missing data-widget-key attribute");
    return;
  }

  var scriptUrl = new URL(script.src);
  var apiBase = scriptUrl.origin;
  var SESSION_KEY = "pumai_webchat_session";

  var sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = "wc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  var config = null;
  var isOpen = false;
  var messages = [];

  fetch(apiBase + "/api/webchat/" + widgetKey + "/config")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) {
        console.error("[PumAI Widget]", data.error);
        return;
      }
      config = data;
      render();
    })
    .catch(function (err) {
      console.error("[PumAI Widget] Config fetch failed", err);
    });

  function render() {
    injectStyles();
    var root = document.createElement("div");
    root.id = "pumai-webchat-root";
    root.setAttribute("data-position", config.position || "right");
    root.innerHTML =
      '<button id="pumai-webchat-btn" aria-label="Open chat">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
        '</svg>' +
      '</button>' +
      '<div id="pumai-webchat-panel">' +
        '<div id="pumai-webchat-header">' +
          '<div id="pumai-webchat-title">' + escapeHtml(config.title) + '</div>' +
          '<button id="pumai-webchat-close" aria-label="Close">×</button>' +
        '</div>' +
        '<div id="pumai-webchat-messages"></div>' +
        '<form id="pumai-webchat-form">' +
          '<input id="pumai-webchat-input" type="text" placeholder="Type a message..." autocomplete="off" required />' +
          '<button type="submit" id="pumai-webchat-send" aria-label="Send">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
              '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>' +
            '</svg>' +
          '</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(root);

    var btn = document.getElementById("pumai-webchat-btn");
    var panel = document.getElementById("pumai-webchat-panel");
    var closeBtn = document.getElementById("pumai-webchat-close");
    var form = document.getElementById("pumai-webchat-form");
    var input = document.getElementById("pumai-webchat-input");

    btn.addEventListener("click", function () {
      isOpen = true;
      root.classList.add("pumai-open");
      if (messages.length === 0 && config.welcomeMessage) {
        pushMessage("agent", config.welcomeMessage);
      }
      setTimeout(function () { input.focus(); }, 50);
    });

    closeBtn.addEventListener("click", function () {
      isOpen = false;
      root.classList.remove("pumai-open");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      input.value = "";
      sendMessage(text);
    });
  }

  function sendMessage(text) {
    pushMessage("user", text);
    showTyping(true);

    fetch(apiBase + "/api/webchat/" + widgetKey + "/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId, message: text }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        showTyping(false);
        if (data.response) {
          pushMessage("agent", data.response);
        } else if (data.error) {
          pushMessage("agent", "Sorry, something went wrong.");
        }
      })
      .catch(function () {
        showTyping(false);
        pushMessage("agent", "Connection error. Please try again.");
      });
  }

  function pushMessage(role, text) {
    messages.push({ role: role, text: text });
    var wrap = document.getElementById("pumai-webchat-messages");
    var el = document.createElement("div");
    el.className = "pumai-msg pumai-msg-" + role;
    el.textContent = text;
    wrap.appendChild(el);
    wrap.scrollTop = wrap.scrollHeight;
  }

  function showTyping(on) {
    var wrap = document.getElementById("pumai-webchat-messages");
    var existing = document.getElementById("pumai-typing");
    if (on && !existing) {
      var el = document.createElement("div");
      el.id = "pumai-typing";
      el.className = "pumai-msg pumai-msg-agent pumai-typing-dots";
      el.innerHTML = '<span></span><span></span><span></span>';
      wrap.appendChild(el);
      wrap.scrollTop = wrap.scrollHeight;
    } else if (!on && existing) {
      existing.remove();
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function injectStyles() {
    var color = config.primaryColor || "#8B5CF6";
    var css =
      "#pumai-webchat-root { position: fixed; bottom: 20px; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }" +
      "#pumai-webchat-root[data-position='right'] { right: 20px; }" +
      "#pumai-webchat-root[data-position='left'] { left: 20px; }" +
      "#pumai-webchat-btn { width: 56px; height: 56px; border-radius: 50%; border: none; background: " + color + "; color: white; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.15); display: flex; align-items: center; justify-content: center; transition: transform .15s; }" +
      "#pumai-webchat-btn:hover { transform: scale(1.05); }" +
      "#pumai-webchat-panel { display: none; width: 360px; height: 520px; background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,.18); flex-direction: column; overflow: hidden; }" +
      "#pumai-webchat-root.pumai-open #pumai-webchat-panel { display: flex; }" +
      "#pumai-webchat-root.pumai-open #pumai-webchat-btn { display: none; }" +
      "#pumai-webchat-header { padding: 14px 16px; background: " + color + "; color: white; display: flex; align-items: center; justify-content: space-between; }" +
      "#pumai-webchat-title { font-weight: 600; font-size: 15px; }" +
      "#pumai-webchat-close { background: transparent; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; line-height: 1; }" +
      "#pumai-webchat-messages { flex: 1; overflow-y: auto; padding: 16px; background: #f8f8fa; display: flex; flex-direction: column; gap: 8px; }" +
      ".pumai-msg { max-width: 80%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word; }" +
      ".pumai-msg-user { align-self: flex-end; background: " + color + "; color: white; border-bottom-right-radius: 4px; }" +
      ".pumai-msg-agent { align-self: flex-start; background: white; color: #1a1a1a; border: 1px solid #e5e5ea; border-bottom-left-radius: 4px; }" +
      ".pumai-typing-dots { display: flex; gap: 4px; align-items: center; }" +
      ".pumai-typing-dots span { width: 6px; height: 6px; border-radius: 50%; background: #999; animation: pumai-bounce 1.3s infinite; }" +
      ".pumai-typing-dots span:nth-child(2) { animation-delay: .15s; }" +
      ".pumai-typing-dots span:nth-child(3) { animation-delay: .3s; }" +
      "@keyframes pumai-bounce { 0%,60%,100% { opacity: .3 } 30% { opacity: 1 } }" +
      "#pumai-webchat-form { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #e5e5ea; background: white; }" +
      "#pumai-webchat-input { flex: 1; border: 1px solid #e5e5ea; border-radius: 20px; padding: 8px 14px; font-size: 14px; outline: none; font-family: inherit; color: #1a1a1a; background: white; }" +
      "#pumai-webchat-input::placeholder { color: #999; }" +
      "#pumai-webchat-input:focus { border-color: " + color + "; }" +
      "#pumai-webchat-send { width: 36px; height: 36px; border-radius: 50%; border: none; background: " + color + "; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }" +
      "#pumai-webchat-send:disabled { opacity: .5; cursor: not-allowed; }" +
      "@media (max-width: 420px) { #pumai-webchat-panel { width: calc(100vw - 40px); height: calc(100vh - 100px); } }";
    var style = document.createElement("style");
    style.id = "pumai-webchat-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }
})();

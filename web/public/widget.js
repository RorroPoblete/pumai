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
  var SESSION_KEY = "pumai_webchat_session_" + widgetKey;
  var VISITOR_KEY = "pumai_webchat_visitor_" + widgetKey;

  var sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = "wc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  var visitor = null;
  try { visitor = JSON.parse(localStorage.getItem(VISITOR_KEY) || "null"); } catch (e) {}
  if (visitor && typeof visitor.email !== "undefined") { delete visitor.email; }

  var config = null;
  var messages = [];
  var shadow = null;
  var eventSource = null;

  function $(id) { return shadow ? shadow.querySelector("#" + id) : null; }

  fetch(apiBase + "/api/webchat/" + widgetKey + "/config")
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.error) { console.error("[PumAI Widget]", data.error); return; }
      config = data;
      render();
    })
    .catch(function (err) { console.error("[PumAI Widget] Config fetch failed", err); });

  function render() {
    var host = document.createElement("div");
    host.id = "pumai-webchat-host";
    host.style.all = "initial";
    shadow = host.attachShadow({ mode: "open" });
    document.body.appendChild(host);

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
        '<div id="pumai-webchat-body"></div>' +
      '</div>';
    shadow.appendChild(root);

    $("pumai-webchat-btn").addEventListener("click", function () {
      root.classList.add("pumai-open");
      openBody();
      markSeen();
    });
    $("pumai-webchat-close").addEventListener("click", function () {
      root.classList.remove("pumai-open");
    });
  }

  function openBody() {
    var body = $("pumai-webchat-body");
    if (config.offlineMode === "always") {
      renderOfflineForm(body);
      return;
    }
    var needsVisitor = (config.collectVisitor === "required" || config.collectVisitor === "optional") && !visitor;
    if (needsVisitor) renderVisitorForm(body);
    else renderChat(body);
  }

  function renderOfflineForm(body) {
    body.innerHTML =
      '<div class="pumai-form">' +
        '<p class="pumai-form-text">We\'re offline right now. Leave a message and we\'ll reply when you return.</p>' +
        '<input id="pumai-off-name" type="text" placeholder="Your name (optional)" />' +
        '<textarea id="pumai-off-msg" placeholder="Your message *" rows="5" required></textarea>' +
        '<button id="pumai-off-submit" class="pumai-primary-btn">Send</button>' +
        '<p id="pumai-off-status" class="pumai-form-status"></p>' +
      '</div>';

    $("pumai-off-submit").addEventListener("click", function () {
      var name = $("pumai-off-name").value.trim();
      var message = $("pumai-off-msg").value.trim();
      var status = $("pumai-off-status");
      if (!message) { status.textContent = "Message is required."; return; }
      status.textContent = "Sending...";
      fetch(apiBase + "/api/webchat/" + widgetKey + "/offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId, name: name, message: message }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.ok) {
            body.innerHTML = '<div class="pumai-form"><p class="pumai-form-text">Thanks! Come back anytime to see our reply.</p></div>';
          } else {
            status.textContent = data.error || "Something went wrong.";
          }
        })
        .catch(function () { status.textContent = "Connection error."; });
    });
  }

  function renderVisitorForm(body) {
    var required = config.collectVisitor === "required";
    body.innerHTML =
      '<div class="pumai-form">' +
        '<p class="pumai-form-text">Please tell us your name so we can help you better.</p>' +
        '<input id="pumai-visitor-name" type="text" placeholder="Your name" />' +
        '<button id="pumai-visitor-submit" class="pumai-primary-btn">Start chat</button>' +
        (required ? '' : '<button id="pumai-visitor-skip" class="pumai-skip-btn">Skip</button>') +
      '</div>';

    $("pumai-visitor-submit").addEventListener("click", function () {
      var name = $("pumai-visitor-name").value.trim();
      if (required && !name) return;
      visitor = { name: name };
      localStorage.setItem(VISITOR_KEY, JSON.stringify(visitor));
      renderChat($("pumai-webchat-body"));
    });

    if (!required) {
      $("pumai-visitor-skip").addEventListener("click", function () {
        visitor = { name: "" };
        renderChat($("pumai-webchat-body"));
      });
    }
  }

  function renderChat(body) {
    body.innerHTML =
      '<div id="pumai-webchat-messages"></div>' +
      '<form id="pumai-webchat-form">' +
        '<button type="button" id="pumai-webchat-attach" aria-label="Attach image">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>' +
          '</svg>' +
        '</button>' +
        '<input id="pumai-webchat-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden />' +
        '<input id="pumai-webchat-input" type="text" placeholder="Type a message..." autocomplete="off" />' +
        '<button type="submit" id="pumai-webchat-send" aria-label="Send">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>' +
          '</svg>' +
        '</button>' +
      '</form>' +
      '<div id="pumai-webchat-disclosure" style="padding:6px 14px;font-size:10px;color:#71717A;text-align:center;border-top:1px solid rgba(113,113,122,0.15);">' +
        'Powered by AI — may make mistakes' +
      '</div>';

    var form = $("pumai-webchat-form");
    var input = $("pumai-webchat-input");
    var sendBtn = $("pumai-webchat-send");
    var attachBtn = $("pumai-webchat-attach");
    var fileInput = $("pumai-webchat-file");

    if (messages.length === 0 && config.welcomeMessage) {
      pushMessage("agent", config.welcomeMessage);
    } else {
      messages.forEach(function (m) { renderBubble(m); });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      input.value = "";
      sendMessage(text, null, sendBtn, attachBtn, input);
    });

    attachBtn.addEventListener("click", function () { fileInput.click(); });
    fileInput.addEventListener("change", function () {
      var f = fileInput.files[0];
      if (!f) return;
      uploadAndSend(f, sendBtn, attachBtn, input);
      fileInput.value = "";
    });

    setTimeout(function () { input.focus(); }, 50);
    openAgentStream();
  }

  function openAgentStream() {
    if (eventSource) { try { eventSource.close(); } catch (e) {} }
    var url = apiBase + "/api/webchat/" + widgetKey + "/events?sessionId=" + encodeURIComponent(sessionId);
    try {
      eventSource = new EventSource(url);
      eventSource.onmessage = function (ev) {
        var payload;
        try { payload = JSON.parse(ev.data); } catch (e) { return; }
        if (payload.type === "agent_message" && payload.content) {
          pushMessage("agent", payload.content);
          markSeen();
        }
      };
      eventSource.onerror = function () {
        try { eventSource.close(); } catch (e) {}
        eventSource = null;
      };
    } catch (e) {
      // EventSource not supported
    }
  }

  function uploadAndSend(file, sendBtn, attachBtn, input) {
    sendBtn.disabled = true;
    attachBtn.disabled = true;
    var fd = new FormData();
    fd.append("file", file);
    fetch(apiBase + "/api/webchat/" + widgetKey + "/upload", { method: "POST", body: fd })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.url) {
          pushMessage("agent", data.error || "Upload failed.");
          sendBtn.disabled = false;
          attachBtn.disabled = false;
          return;
        }
        var attachment = { url: apiBase + data.url, type: data.type };
        sendMessage("", attachment, sendBtn, attachBtn, input);
      })
      .catch(function () {
        pushMessage("agent", "Upload failed.");
        sendBtn.disabled = false;
        attachBtn.disabled = false;
      });
  }

  function sendMessage(text, attachment, sendBtn, attachBtn, input) {
    pushMessage("user", text, attachment);
    sendBtn.disabled = true;
    attachBtn.disabled = true;
    showTyping(true);
    streamResponse(text, attachment, sendBtn, attachBtn, input);
  }

  function streamResponse(text, attachment, sendBtn, attachBtn, input) {
    fetch(apiBase + "/api/webchat/" + widgetKey + "/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "text/event-stream" },
      body: JSON.stringify({ sessionId: sessionId, message: text, visitor: visitor, attachment: attachment }),
    })
      .then(function (res) {
        if (!res.ok || !res.body) throw new Error("stream failed");
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var buf = "";
        var bubble = null;
        var current = "";
        showTyping(false);

        function pump() {
          return reader.read().then(function (r) {
            if (r.done) { finalize(); return; }
            buf += decoder.decode(r.value, { stream: true });
            var parts = buf.split("\n\n");
            buf = parts.pop() || "";
            parts.forEach(function (part) {
              var line = part.trim();
              if (!line.startsWith("data:")) return;
              var payload;
              try { payload = JSON.parse(line.slice(5).trim()); } catch (e) { return; }
              if (payload.type === "token") {
                if (!bubble) bubble = createBubble("agent");
                current += payload.content;
                bubble.textContent = current;
                scrollBottom();
              } else if (payload.type === "done") {
                if (current) messages.push({ role: "agent", text: current });
                finalize();
              } else if (payload.type === "error") {
                if (!bubble) bubble = createBubble("agent");
                bubble.textContent = "Sorry, something went wrong.";
                finalize();
              }
            });
            return pump();
          });
        }

        function finalize() {
          sendBtn.disabled = false;
          attachBtn.disabled = false;
          if (input) input.focus();
        }

        return pump();
      })
      .catch(function () {
        showTyping(false);
        sendMessage_fallback(text, attachment, sendBtn, attachBtn, input);
      });
  }

  function sendMessage_fallback(text, attachment, sendBtn, attachBtn, input) {
    showTyping(true);
    fetch(apiBase + "/api/webchat/" + widgetKey + "/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId, message: text, visitor: visitor, attachment: attachment }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        showTyping(false);
        sendBtn.disabled = false;
        attachBtn.disabled = false;
        if (data.response) pushMessage("agent", data.response);
        else pushMessage("agent", "Sorry, something went wrong.");
        if (input) input.focus();
      })
      .catch(function () {
        showTyping(false);
        sendBtn.disabled = false;
        attachBtn.disabled = false;
        pushMessage("agent", "Connection error. Please try again.");
      });
  }

  function pushMessage(role, text, attachment) {
    var m = { role: role, text: text, attachment: attachment || null };
    messages.push(m);
    renderBubble(m);
  }

  function renderBubble(m) {
    var wrap = $("pumai-webchat-messages");
    if (!wrap) return;
    var el = document.createElement("div");
    el.className = "pumai-msg pumai-msg-" + m.role;
    if (m.attachment && m.attachment.url) {
      var img = document.createElement("img");
      img.src = m.attachment.url;
      img.className = "pumai-msg-image";
      img.alt = "attachment";
      img.loading = "lazy";
      el.appendChild(img);
    }
    if (m.text) {
      var txt = document.createElement("div");
      txt.textContent = m.text;
      el.appendChild(txt);
    }
    wrap.appendChild(el);
    scrollBottom();
  }

  function createBubble(role) {
    var wrap = $("pumai-webchat-messages");
    var el = document.createElement("div");
    el.className = "pumai-msg pumai-msg-" + role;
    wrap.appendChild(el);
    scrollBottom();
    return el;
  }

  function scrollBottom() {
    var wrap = $("pumai-webchat-messages");
    if (wrap) wrap.scrollTop = wrap.scrollHeight;
  }

  function showTyping(on) {
    var wrap = $("pumai-webchat-messages");
    if (!wrap) return;
    var existing = $("pumai-typing");
    if (on && !existing) {
      var el = document.createElement("div");
      el.id = "pumai-typing";
      el.className = "pumai-msg pumai-msg-agent pumai-typing-dots";
      el.innerHTML = '<span></span><span></span><span></span>';
      wrap.appendChild(el);
      scrollBottom();
    } else if (!on && existing) {
      existing.remove();
    }
  }

  function markSeen() {
    fetch(apiBase + "/api/webchat/" + widgetKey + "/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionId }),
    }).catch(function () {});
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function injectStyles() {
    var color = config.primaryColor || "#8B5CF6";
    var css =
      ":host { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }" +
      "*, *::before, *::after { box-sizing: border-box; }" +
      "#pumai-webchat-root { position: fixed; bottom: 20px; z-index: 2147483647; font-family: inherit; }" +
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
      "#pumai-webchat-body { flex: 1; display: flex; flex-direction: column; min-height: 0; }" +
      ".pumai-form { padding: 20px; display: flex; flex-direction: column; gap: 10px; background: #f8f8fa; height: 100%; overflow-y: auto; }" +
      ".pumai-form-text { margin: 0 0 6px; color: #555; font-size: 13px; line-height: 1.4; }" +
      ".pumai-form input, .pumai-form textarea { border: 1px solid #e5e5ea; border-radius: 10px; padding: 10px 12px; font-size: 14px; outline: none; color: #1a1a1a; background: white; font-family: inherit; resize: vertical; }" +
      ".pumai-form input:focus, .pumai-form textarea:focus { border-color: " + color + "; }" +
      ".pumai-form-status { font-size: 12px; color: #888; margin: 0; min-height: 14px; }" +
      ".pumai-primary-btn { background: " + color + "; color: white; border: none; border-radius: 10px; padding: 10px 14px; font-size: 14px; font-weight: 600; cursor: pointer; }" +
      ".pumai-skip-btn { background: transparent; border: none; color: #888; font-size: 12px; cursor: pointer; text-decoration: underline; }" +
      "#pumai-webchat-messages { flex: 1; overflow-y: auto; padding: 16px; background: #f8f8fa; display: flex; flex-direction: column; gap: 8px; }" +
      ".pumai-msg { max-width: 80%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word; }" +
      ".pumai-msg-user { align-self: flex-end; background: " + color + "; color: white; border-bottom-right-radius: 4px; }" +
      ".pumai-msg-agent { align-self: flex-start; background: white; color: #1a1a1a; border: 1px solid #e5e5ea; border-bottom-left-radius: 4px; }" +
      ".pumai-msg-image { max-width: 100%; border-radius: 8px; display: block; margin-bottom: 4px; }" +
      ".pumai-typing-dots { display: flex; gap: 4px; align-items: center; }" +
      ".pumai-typing-dots span { width: 6px; height: 6px; border-radius: 50%; background: #999; animation: pumai-bounce 1.3s infinite; }" +
      ".pumai-typing-dots span:nth-child(2) { animation-delay: .15s; }" +
      ".pumai-typing-dots span:nth-child(3) { animation-delay: .3s; }" +
      "@keyframes pumai-bounce { 0%,60%,100% { opacity: .3 } 30% { opacity: 1 } }" +
      "#pumai-webchat-form { display: flex; gap: 6px; padding: 10px; border-top: 1px solid #e5e5ea; background: white; align-items: center; }" +
      "#pumai-webchat-attach { width: 36px; height: 36px; border-radius: 50%; border: none; background: #f0f0f3; color: #555; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }" +
      "#pumai-webchat-attach:hover { background: #e5e5ea; }" +
      "#pumai-webchat-attach:disabled { opacity: .5; cursor: not-allowed; }" +
      "#pumai-webchat-input { flex: 1; border: 1px solid #e5e5ea; border-radius: 20px; padding: 8px 14px; font-size: 14px; outline: none; font-family: inherit; color: #1a1a1a; background: white; min-width: 0; }" +
      "#pumai-webchat-input::placeholder { color: #999; }" +
      "#pumai-webchat-input:focus { border-color: " + color + "; }" +
      "#pumai-webchat-send { width: 36px; height: 36px; border-radius: 50%; border: none; background: " + color + "; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }" +
      "#pumai-webchat-send:disabled { opacity: .5; cursor: not-allowed; }" +
      "@media (max-width: 420px) { #pumai-webchat-panel { width: calc(100vw - 40px); height: calc(100vh - 100px); } }";
    var style = document.createElement("style");
    style.textContent = css;
    shadow.appendChild(style);
  }
})();

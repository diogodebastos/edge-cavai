/** @type {{ role: string, content: string }[]} */
var chatHistory = [];

var messagesList = document.querySelector('.messages-list');
var messageForm = document.querySelector('.message-form');
var messageInput = document.querySelector('.message-input');
var messagesBox = document.querySelector('.messages-box');
var chatHero = document.querySelector('.chat-hero');
var resetBtn = document.getElementById('reset-chat');

function typeMessage(element, message) {
  var caret = document.createElement('span');
  caret.className = 'typing-caret';
  caret.textContent = '▍';
  element.appendChild(caret);

  var index = 0;
  function type() {
    if (index < message.length) {
      caret.insertAdjacentText('beforebegin', message.charAt(index));
      index++;
      setTimeout(type, 10);
      messagesBox.scrollTop = messagesBox.scrollHeight;
    } else {
      caret.remove();
    }
  }
  type();
}

function extractLinks(text) {
  var urlRegex = /(https?:\/\/[^\s)]+)/g;
  var matches = text.match(urlRegex);
  return matches && matches.length > 0 ? matches[0] : '';
}

function appendMessage(role, text) {
  var li = document.createElement('li');
  var cssClass = role === 'user' ? 'sent' : 'received';
  var contentClass = role === 'user' ? 'message-content-USER' : 'message-content-AI';

  li.classList.add('message', cssClass);
  li.innerHTML =
    '<div class="message-text">' +
      '<div class="' + contentClass + '"><span class="bubble-text"></span></div>' +
    '</div>';

  messagesList.appendChild(li);
  messagesBox.scrollTop = messagesBox.scrollHeight;

  var contentEl = li.querySelector('.bubble-text');

  if (role === 'assistant') {
    var link = extractLinks(text);
    if (link) {
      var escaped = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      contentEl.innerHTML = escaped.replace(link, '<a href="' + link + '" target="_blank" rel="noopener">' + link + '</a>');
    } else {
      typeMessage(contentEl, text);
    }
  } else {
    contentEl.textContent = text;
  }

  return li;
}

function appendThinking(isPreview) {
  var li = document.createElement('li');
  li.classList.add('message', 'received');
  if (isPreview) li.setAttribute('data-preview', 'true');
  li.innerHTML = '<div class="message-text"><div class="message-content-AI"><span class="bubble-text thinking-text">Thinking…</span></div></div>';
  messagesList.appendChild(li);
  messagesBox.scrollTop = messagesBox.scrollHeight;
  return li;
}

function clearPreview() {
  messagesList.querySelectorAll('.message[data-preview]').forEach(function (el) { el.remove(); });
}

function sendMessage(message) {
  if (!message) return;

  // Dismiss hero on first user interaction
  if (chatHero && !chatHero.classList.contains('is-dismissed')) {
    chatHero.classList.add('is-dismissed');
    chatHero.style.display = 'none';
  }
  clearPreview();
  if (resetBtn) resetBtn.hidden = false;

  appendMessage('user', message);
  chatHistory.push({ role: 'user', content: message });

  var thinkingEl = appendThinking(false);

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message, history: chatHistory.slice(0, -1) }),
  })
    .then(function (res) {
      if (!res.ok) throw new Error('Request failed (' + res.status + ')');
      return res.json();
    })
    .then(function (data) {
      thinkingEl.remove();
      var response = (data.response || '').replace(/^\s+/, '');
      appendMessage('assistant', response);
      chatHistory.push({ role: 'assistant', content: response });
    })
    .catch(function () {
      thinkingEl.remove();
      appendMessage('assistant', 'Sorry, something went wrong. Please try again.');
    });
}

messageForm.addEventListener('submit', function (event) {
  event.preventDefault();
  var message = messageInput.value.trim();
  if (!message) return;
  messageInput.value = '';
  sendMessage(message);
});

// Reset / new chat
function resetChat() {
  chatHistory = [];
  messagesList.innerHTML = '';
  messageInput.value = '';
  if (chatHero) {
    chatHero.classList.remove('is-dismissed');
    chatHero.style.display = '';
  }
  if (resetBtn) resetBtn.hidden = true;
  messageInput.focus();
}
if (resetBtn) resetBtn.addEventListener('click', resetChat);

// Default preview interaction on landing — visible demo, not part of chatHistory.
function appendPreview(role, text, animate) {
  var li = document.createElement('li');
  var cssClass = role === 'user' ? 'sent' : 'received';
  var contentClass = role === 'user' ? 'message-content-USER' : 'message-content-AI';
  li.classList.add('message', cssClass);
  li.setAttribute('data-preview', 'true');
  li.innerHTML = '<div class="message-text"><div class="' + contentClass + '"><span class="bubble-text"></span></div></div>';
  messagesList.appendChild(li);
  var contentEl = li.querySelector('.bubble-text');
  if (animate) typeMessage(contentEl, text);
  else contentEl.textContent = text;
  return li;
}

(function loadPreviewInteraction() {
  var question = "Summarize Diogo's CV in one concise sentence.";
  appendPreview('user', question, false);
  var thinkingPreview = appendThinking(true);
  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: question, history: [] }),
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      // If the user already started a real chat, bail.
      if (chatHistory.length > 0) return;
      thinkingPreview.remove();
      var response = (data.response || '').replace(/^\s+/, '');
      appendPreview('assistant', response, true);
    })
    .catch(function () { thinkingPreview.remove(); });
})();

// Suggestion chips: prefill + focus, do not auto-send
document.querySelectorAll('.chip').forEach(function (chip) {
  chip.addEventListener('click', function () {
    var prompt = chip.getAttribute('data-prompt') || chip.textContent.trim();
    messageInput.value = prompt;
    messageInput.focus();
  });
});

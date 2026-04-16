/** @type {{ role: string, content: string }[]} */
var chatHistory = [];

var messagesList = document.querySelector('.messages-list');
var messageForm = document.querySelector('.message-form');
var messageInput = document.querySelector('.message-input');
var messagesBox = document.querySelector('.messages-box');

function typeMessage(element, message) {
  var index = 0;
  function type() {
    if (index < message.length) {
      element.innerHTML += message.charAt(index);
      index++;
      setTimeout(type, 10);
      element.scrollTop = element.scrollHeight;
      messagesBox.scrollTop = messagesBox.scrollHeight;
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
      '<div class="message-sender"><b></b></div>' +
      '<div class="' + contentClass + '"></div>' +
    '</div>';

  messagesList.appendChild(li);
  messagesBox.scrollTop = messagesBox.scrollHeight;

  var contentEl = li.querySelector('.' + contentClass);

  if (role === 'assistant') {
    var link = extractLinks(text);
    if (link) {
      contentEl.innerHTML = '<a href="' + link + '" target="_blank">' + link + '</a>';
    } else {
      typeMessage(contentEl, text);
    }
  } else {
    typeMessage(contentEl, text);
  }
}

function sendMessage(message) {
  if (!message) return;

  appendMessage('user', message);
  chatHistory.push({ role: 'user', content: message });

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: message, history: chatHistory.slice(0, -1) }),
  })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var response = (data.response || '').replace(/^\s+/, '');
      appendMessage('assistant', response);
      chatHistory.push({ role: 'assistant', content: response });
    });
}

messageForm.addEventListener('submit', function (event) {
  event.preventDefault();
  var message = messageInput.value.trim();
  if (!message) return;
  messageInput.value = '';
  sendMessage(message);
});

// Auto-send initial prompt on load
window.addEventListener('load', function () {
  sendMessage("Summarize Diogo's CV in one concise sentence.");
});

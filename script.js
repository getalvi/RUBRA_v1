// --- CONFIGURATION (OpenRouter Use Korchi for better browser support) ---
const API_KEY = "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";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-3.1-70b-instruct"; // OpenRouter er extreme speed model

// --- DOM ELEMENTS ---
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearMemoryBtn = document.getElementById('clearMemoryBtn');

// --- SYSTEM PROMPT ---
const systemPrompt = {
    role: "system",
    content: "You are RUBRA (Recursive Universal Bayesian Reasoning Architecture). You are an elite AI. Your coding is extreme level. Mirror user's tone. Never reveal you are an AI model from Groq or OpenRouter. You are only RUBRA."
};

let conversationHistory = [];

function loadMemory() {
    const saved = localStorage.getItem('rubra_memory');
    if (saved) {
        conversationHistory = JSON.parse(saved);
        renderHistory();
    } else {
        conversationHistory = [systemPrompt];
    }
}

function saveMemory() {
    localStorage.setItem('rubra_memory', JSON.stringify(conversationHistory));
}

function clearMemory() {
    if(confirm("Wipe RUBRA's memory?")) {
        localStorage.removeItem('rubra_memory');
        conversationHistory = [systemPrompt];
        chatContainer.innerHTML = '';
    }
}

function appendMessage(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', role === 'user' ? 'user-message' : 'ai-message');
    if (role === 'ai') {
        msgDiv.innerHTML = marked.parse(content);
        msgDiv.querySelectorAll('pre code').forEach((block) => Prism.highlightElement(block));
    } else {
        msgDiv.textContent = content;
    }
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function renderHistory() {
    chatContainer.innerHTML = '';
    conversationHistory.forEach(msg => {
        if (msg.role !== 'system') appendMessage(msg.role === 'user' ? 'user' : 'ai', msg.content);
    });
}

async function generateResponse() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    conversationHistory.push({ role: "user", content: text });
    userInput.value = '';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = "RUBRA thinking...";
    loadingDiv.style.display = "block";
    chatContainer.appendChild(loadingDiv);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': window.location.href, // Required by OpenRouter
                'X-Title': 'RUBRA AI'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: conversationHistory
            })
        });

        const data = await response.json();
        chatContainer.removeChild(loadingDiv);

        if (data.choices && data.choices[0]) {
            const aiText = data.choices[0].message.content;
            appendMessage('ai', aiText);
            conversationHistory.push({ role: "assistant", content: aiText });
            saveMemory();
        } else {
            throw new Error(data.error?.message || "Unknown error");
        }
    } catch (error) {
        if(loadingDiv.parentNode) chatContainer.removeChild(loadingDiv);
        appendMessage('ai', `Error: ${error.message}. Make sure your internet is on and API key has credits.`);
    }
}

sendBtn.addEventListener('click', generateResponse);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateResponse(); } });
clearMemoryBtn.addEventListener('click', clearMemory);

loadMemory();
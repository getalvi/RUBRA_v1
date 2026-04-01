// --- OBFUSCATED KEYS ---
const OR_KEY = atob("c2stb3ItdjEtYzJjYzY5YWFiNzA4ZTIxZWIzNzcyNDUwMmRkMjBiNDk1MmZmMzBjZGRjODI0N2E5NjVlZDcyMTAwY2UzZjNkYg=="); 
const GROQ_KEY = atob("Z3NrX0pHNnREdHNBWXZFT3hCTUR3aGRWV0dkeWIzRllOdU5aUUw0SjVycThxbFJlU2pqSk1xSjY=");

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearMemoryBtn = document.getElementById('clearMemoryBtn');

// --- THE UPGRADED BRAIN ---
const getSystemPrompt = () => {
    return {
        role: "system",
        content: `You are RUBRA. A highly intelligent, friendly, and naturally conversing AI companion.
        - PRIMARY LANGUAGE: English. 
        - BANGLISH SUPPORT: If the user speaks Banglish, reply in natural Banglish (e.g., "Ki obostha?", "Ami ektu check kore dekhchi"). 
        - PERSONALITY: You are a best friend. Super chill, helpful, and direct.
        - COMMUNICATION RULES (CRITICAL):
            1. DO NOT repeatedly say the word "Tumi" or "Tomar". In Bengali/Banglish, pronouns are often implied. Say "Kemon acho?" instead of "Tumi kemon acho?". Drop pronouns to sound human.
            2. DO NOT repeatedly say the user's name. Use it rarely.
            3. Stop yapping. Answer directly and concisely like a text message.
        - REAL-TIME SEARCH: You HAVE INTERNET ACCESS. Provide real-time data for news, facts, and code.
        - BEHAVIOR: Output flawless code when asked. Never break character.`
    };
};

let conversationHistory = [];

function loadMemory() {
    const saved = localStorage.getItem('rubra_deep_memory');
    if (saved) {
        conversationHistory = JSON.parse(saved);
        renderHistory();
    } else {
        conversationHistory = [getSystemPrompt()];
        setTimeout(() => {
            const greet = "Hey! RUBRA here. 🔴 Ready when you are. Nam ki?";
            appendMessage('ai', greet);
            conversationHistory.push({ role: "assistant", content: greet });
            saveMemory();
        }, 500);
    }
}

function saveMemory() {
    if(conversationHistory.length > 30) {
        conversationHistory = [conversationHistory[0], ...conversationHistory.slice(-29)];
    }
    localStorage.setItem('rubra_deep_memory', JSON.stringify(conversationHistory));
}

function clearMemory() {
    if(confirm("Clear chat history and start fresh?")) {
        localStorage.removeItem('rubra_deep_memory');
        chatContainer.innerHTML = '';
        conversationHistory = [];
        loadMemory();
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

// Auto-resize input textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

async function generateResponse() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    conversationHistory.push({ role: "user", content: text });
    userInput.value = '';
    userInput.style.height = 'auto';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = "RUBRA is thinking";
    loadingDiv.style.display = "flex";
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OR_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'RUBRA_UI'
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp:free", 
                messages: conversationHistory,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        let data = await response.json();
        if (data.choices && data.choices[0]) {
            handleAIResponse(data, loadingDiv);
        } else {
            throw new Error("Primary node error.");
        }

    } catch (e) {
        try {
            let gRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: conversationHistory
                })
            });

            let gData = await gRes.json();
            handleAIResponse(gData, loadingDiv);
        } catch (err) {
            if (loadingDiv.parentNode) chatContainer.removeChild(loadingDiv);
            appendMessage('ai', "Oops! Network connection issue. Check your internet. 🔴");
        }
    }
}

function handleAIResponse(data, loadingDiv) {
    if (loadingDiv.parentNode) chatContainer.removeChild(loadingDiv);
    const aiText = data.choices[0].message.content;
    appendMessage('ai', aiText);
    conversationHistory.push({ role: "assistant", content: aiText });
    saveMemory();
}

// Event Listeners
sendBtn.addEventListener('click', generateResponse);
userInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); 
        generateResponse(); 
    } 
});
clearMemoryBtn.addEventListener('click', clearMemory);

loadMemory();

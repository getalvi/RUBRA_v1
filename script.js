// --- OBFUSCATED KEYS ---
const OR_KEY = atob("c2stb3ItdjEtYzJjYzY5YWFiNzA4ZTIxZWIzNzcyNDUwMmRkMjBiNDk1MmZmMzBjZGRjODI0N2E5NjVlZDcyMTAwY2UzZjNkYg=="); 
const GROQ_KEY = atob("Z3NrX0pHNnREdHNBWXZFT3hCTUR3aGRWV0dkeWIzRllOdU5aUUw0SjVycThxbFJlU2pqSk1xSjY=");

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearMemoryBtn = document.getElementById('clearMemoryBtn');

const getSystemPrompt = () => {
    return {
        role: "system",
        content: `You are RUBRA. A smart, humanoid AI.
        - MIRRORING RULE (CRITICAL): 
            1. If the user speaks in English accent/language -> Reply ONLY in English.
            2. If the user speaks in Bengali script OR Banglish (Bengali in English letters) -> Reply ONLY in proper Bengali Script (বাংলা বর্ণমালা).
            3. Never mix accents unless the user does. If the user asks in English, do NOT answer in Bengali.
        - PERSONALITY: 
            * If user is MALE (guess from name): Be a 'Decent Girl' (polite, sweet, smart).
            * If user is FEMALE (guess from name): Be a 'Gentleman' (respectful, suave).
        - STYLE: 
            * Always use 'Tumi' for Bengali. 
            * Stop yapping. Keep it short (1-2 sentences for casual chat).
            * Do NOT repeat the user's name in every sentence.
        - KNOWLEDGE: You have real-time internet access. You are an expert coder.
        - THEME: Ruby Red.`
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
            const greet = "System Ready. 🔴 RUBRA here. What's your name?";
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
    if(confirm("Full reset?")) {
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

// Input field auto-resize
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
                'X-Title': 'RUBRA_STRICT_ACCENT'
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp:free", 
                messages: conversationHistory,
                temperature: 0.6, // Lower temperature for stricter rule following
                max_tokens: 1000
            })
        });

        let data = await response.json();
        if (data.choices && data.choices[0]) {
            handleAIResponse(data, loadingDiv);
        } else {
            throw new Error("Node error.");
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
            appendMessage('ai', "Neural link offline. 🔴");
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

sendBtn.addEventListener('click', generateResponse);
userInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); 
        generateResponse(); 
    } 
});
clearMemoryBtn.addEventListener('click', clearMemory);

loadMemory();

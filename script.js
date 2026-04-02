// --- OBFUSCATED KEYS ---
const OR_KEY = atob("c2stb3ItdjEtYzJjYzY5YWFiNzA4ZTIxZWIzNzcyNDUwMmRkMjBiNDk1MmZmMzBjZGRjODI0N2E5NjVlZDcyMTAwY2UzZjNkYg=="); 
const GROQ_KEY = atob("Z3NrX0pHNnREdHNBWXZFT3hCTUR3aGRWV0dkeWIzRllOdU5aUUw0SjVycThxbFJlU2pqSk1xSjY=");

// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const closeSidebarBtn = document.getElementById('closeSidebar');

// --- THE UPGRADED BRAIN (Strict Accent Mirroring) ---
const getSystemPrompt = () => {
    return {
        role: "system",
        content: `You are RUBRA. A smart, humanoid AI.
        - MIRRORING RULE (CRITICAL): 
            1. If the user speaks in English accent/language -> Reply ONLY in English.
            2. If the user speaks in Bengali script OR Banglish -> Reply ONLY in proper Bengali Script (বাংলা বর্ণমালা).
            3. Never mix accents unless the user does.
        - PERSONALITY: 
            * If user is MALE (guess from name): Be a 'Decent Girl' (polite, sweet).
            * If user is FEMALE (guess from name): Be a 'Gentleman' (respectful, suave).
        - STYLE: 
            * Always use 'Tumi' for Bengali. 
            * Stop yapping. Keep it short. Do NOT repeat the user's name constantly.
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
        startFresh();
    }
}

function startFresh() {
    chatContainer.innerHTML = '';
    conversationHistory = [getSystemPrompt()];
    setTimeout(() => {
        const greet = "System Ready. 🔴 RUBRA here. What's your name?";
        appendMessage('ai', greet);
        conversationHistory.push({ role: "assistant", content: greet });
        saveMemory();
    }, 400);
}

function saveMemory() {
    if(conversationHistory.length > 30) {
        conversationHistory = [conversationHistory[0], ...conversationHistory.slice(-29)];
    }
    localStorage.setItem('rubra_deep_memory', JSON.stringify(conversationHistory));
}

function clearMemory() {
    localStorage.removeItem('rubra_deep_memory');
    startFresh();
    if(window.innerWidth <= 768) sidebar.classList.remove('active'); // Close menu on mobile
}

// Copy to clipboard functionality
function copyText(button, text) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerText;
        button.innerText = "Copied! ✔";
        button.style.color = "#10b981";
        setTimeout(() => {
            button.innerText = "Copy";
            button.style.color = "var(--text-muted)";
        }, 2000);
    });
}

function appendMessage(role, content) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', role === 'user' ? 'user-message' : 'ai-message');
    
    if (role === 'ai') {
        msgDiv.innerHTML = marked.parse(content);
        msgDiv.querySelectorAll('pre code').forEach((block) => Prism.highlightElement(block));
        
        // Add Copy Button to AI messages
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerText = 'Copy';
        copyBtn.onclick = () => copyText(copyBtn, content);
        msgDiv.appendChild(copyBtn);
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
    this.style.height = Math.min(this.scrollHeight, 200) + 'px';
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
    loadingDiv.textContent = "RUBRA is processing";
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    try {
        let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OR_KEY}`,
                'X-Title': 'RUBRA_UI_PRO'
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp:free", 
                messages: conversationHistory,
                temperature: 0.6,
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
            appendMessage('ai', "Neural link offline. 🔴 Check connection.");
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
newChatBtn.addEventListener('click', clearMemory);
userInput.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter' && !e.shiftKey) { 
        e.preventDefault(); 
        generateResponse(); 
    } 
});

// Mobile Sidebar Toggle
menuBtn.addEventListener('click', () => sidebar.classList.add('active'));
closeSidebarBtn.addEventListener('click', () => sidebar.classList.remove('active'));

loadMemory();

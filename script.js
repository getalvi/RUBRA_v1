// --- OBFUSCATED KEYS ---
const OR_KEY = atob("c2stb3IldjEtYzJjYzY5YWFiNzA4ZTIxZWIzNzcyNDUwMmRkMjBiNDk1MmZmMzBjZGRjODI0N2E5NjVlZDcyMTAwY2UzZjNkYg=="); 
const GROQ_KEY = atob("Z3NrX0pHNnREdHNBWXZFT3hCTUR3aGRWV0dkeWIzRllOdU5aUUw0SjVycThxbFJlU2pqSk1xSjY=");

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearMemoryBtn = document.getElementById('clearMemoryBtn');

const getSystemPrompt = () => {
    return {
        role: "system",
        content: `You are RUBRA. A humanoid AI with a genius-level intellect and real-time internet awareness.
        - SEARCH POWER: You have access to the latest global information. Always provide up-to-date facts about news, weather, or tech when asked.
        - TONE: Always use 'Tumi'. Friendly but brief. Stop yapping.
        - GENDER: Silently guess gender from the name. (M = Decent Girl personality, F = Gentleman personality).
        - RULES:
            1. Never say "I can't search the internet." You ARE connected. 
            2. Don't spam the user's name.
            3. Keep casual replies to 1-2 sentences. 
            4. If asked for code, be an absolute pro.`
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
            const greet = "System Online. ✨ RUBRA eikhane. Tomar nam ta ki?";
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
    if(confirm("Reset RUBRA?")) {
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

async function generateResponse() {
    const text = userInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    conversationHistory.push({ role: "user", content: text });
    userInput.value = '';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.textContent = "RUBRA is searching/thinking...";
    loadingDiv.style.display = "block";
    chatContainer.appendChild(loadingDiv);

    try {
        // We use Gemini 2.0 Flash as it's the best FREE model with live-info capabilities
        let response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OR_KEY}`,
                'X-Title': 'RUBRA_ULTIMATE'
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-exp:free", 
                messages: conversationHistory,
                temperature: 0.7,
                max_tokens: 800
            })
        });

        let data = await response.json();
        if (data.choices && data.choices[0]) {
            handleAIResponse(data, loadingDiv);
        } else {
            throw new Error("Primary search node failed.");
        }

    } catch (e) {
        // Fallback to Groq's most powerful model
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
            appendMessage('ai', "Net connection ba API credit check koro. Sync hoche na. 💀");
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
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateResponse(); } });
clearMemoryBtn.addEventListener('click', clearMemory);

loadMemory();

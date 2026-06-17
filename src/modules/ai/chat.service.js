import appState from '../../core/appState.js';

export const AI_RESPONSES = {
  'explain current topic': 'Great question! Let me break down the current topic for you:\n\n**Virtual Memory** is a technique that gives each process the illusion of having a large, contiguous block of memory. Key concepts:\n• Pages: Fixed-size blocks of virtual memory\n• Frames: Physical memory blocks\n• Page Table: Maps virtual to physical addresses\n• Page Fault: When a requested page isn\'t in RAM\n\nWant me to create a quiz on this topic?',
  'create a quiz for me': 'Here\'s a quick quiz on the current unit! 🧠\n\n**Q1:** What algorithm avoids deadlock by simulating resource allocation?\na) Round Robin  b) Banker\'s Algorithm  c) FCFS  d) LRU\n\n**Q2:** When does thrashing occur?\na) CPU utilization is 100%  b) Too many page faults  c) Memory is full  d) All processes complete\n\n**Q3:** What does LRU stand for?\na) Least Recently Used  b) Last Random Unit  c) Low Resource Utilization\n\nAnswer in chat and I\'ll grade you! 🎯',
  'summarize this unit': '📚 **Unit Summary: Operating Systems — Memory Management**\n\n1. **Memory Hierarchy**: Registers → Cache → RAM → Disk\n2. **Paging**: Divides memory into fixed-size pages, uses page tables\n3. **Segmentation**: Logical division of programs\n4. **Virtual Memory**: Uses disk as extended RAM via demand paging\n5. **Page Replacement**: FIFO, LRU, Optimal algorithms\n6. **Thrashing**: Excessive paging degrading performance\n\n**Most Important Topics for Exam**: Virtual memory, Banker\'s Algorithm, Page replacement 📌',
  'show my weak areas': '🔍 **Your Weak Area Analysis:**\n\n**Critical (Do immediately):**\n• OS Unit 3 — Memory Management (45% quiz accuracy)\n• CN Unit 4 — Transport Layer (38% accuracy)\n\n**Needs Work:**\n• SE Unit 2 — Design Patterns\n• MP Unit 1 — 8085 Instructions\n\n**Strong Subjects:** Data Structures, DBMS (keep it up!) 💪\n\n**Recommended Plan:** Spend 30 min/day on OS + 20 min on CN for the next 5 days.',
  'generate mind map': '🗺️ **Mind Map: Operating Systems**\n\n```\n         OS\n         │\n    ┌────┼────┐\n   CPU  MEM  I/O\n   │     │    │\n Sched  Paging Files\n   │     │    │\nFCFS  Virtual Disk\nSJF   Memory Sched\nRR   Thrash  DMA\n```\n\nKey branches: Process Management, Memory Management, File Systems, I/O Systems, Security\n\nWant a more detailed mind map for a specific unit?',
  'generate notes for this topic': '📒 **Auto-Generated Notes: Memory Management**\n\n**1. Memory Organization**\nMemory is organized in a hierarchy based on speed and cost. Main memory (RAM) is volatile and directly accessed by CPU.\n\n**2. Paging**\n- Divides logical memory into fixed-size pages\n- Physical memory divided into frames of same size\n- Page table maps logical to physical addresses\n\n**3. Virtual Memory**\n- Extends RAM using disk space\n- Demand paging: Load pages only when needed\n- Page fault → OS loads page from secondary storage\n\n**Key Formulas:**\n• Physical Address = Frame Number × Page Size + Offset\n• Effective Access Time = (1-p) × Memory time + p × Page fault time\n\nDownload full notes as PDF?',
  default: 'That\'s a great question! Let me help you with that. Based on your current learning context in Operating Systems, here\'s what I can share:\n\nOS is a fundamental subject that covers process management, memory management, file systems, and I/O systems. Your current progress shows you\'re doing well on process scheduling but could use more practice on memory management.\n\nWould you like me to:\n• 📝 Generate practice questions\n• 🎯 Create a focused study plan\n• 📊 Analyze your performance data\n• 🗺️ Create a topic mind map',
};

export function toggleChat() {
  appState.chatOpen = !appState.chatOpen;
  const chatWindow = document.getElementById('chat-window');
  if (chatWindow) {
    chatWindow.classList.toggle('open', appState.chatOpen);
  }
  if (appState.chatOpen) {
    document.getElementById('chat-input')?.focus();
  }
}

export function openChat() {
  appState.chatOpen = false;
  toggleChat();
}

export function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input?.value.trim();
  if (!msg) return;
  if (input) input.value = '';
  addChatMsg(msg, 'user');
  showTyping();
  setTimeout(() => {
    removeTyping();
    const key = Object.keys(AI_RESPONSES).find(k => msg.toLowerCase().includes(k));
    const response = AI_RESPONSES[key] || AI_RESPONSES.default;
    addChatMsg(response, 'bot');
  }, 1200 + Math.random() * 600);
}

export function quickChat(msg) {
  const input = document.getElementById('chat-input');
  if (input) input.value = msg;
  sendChat();
}

export function addChatMsg(text, type) {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = `chat-msg ${type}`;
  div.innerHTML = `<div class="chat-bubble">${text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

export function showTyping() {
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.className = 'chat-msg bot'; 
  div.id = 'typing-indicator';
  div.innerHTML = `<div class="chat-bubble"><div class="chat-typing"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

export function removeTyping() {
  document.getElementById('typing-indicator')?.remove();
}

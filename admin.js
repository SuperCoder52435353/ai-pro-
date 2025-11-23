/**
 * AI Pro Converter - Ultimate Admin Panel
 * Version 2.0 - Real-time Chat & Advanced Management
 */

const Admin = {
    currentTab: 'users',
    refreshInterval: null,
    selectedChatUser: null,

    init() {
        this.loadDashboard();
        this.loadUsers();
        this.startAutoRefresh();
    },

    loadDashboard() {
        const users = Storage.load('users', {});
        const logs = Storage.load('logs', []);
        const chats = Storage.load('adminChats', {});

        const totalUsers = Object.keys(users).length;
        const totalConversions = logs.filter(log => log.type === 'convert').length;
        const totalMessages = logs.filter(log => log.type === 'message').length;
        
        let pendingChats = 0;
        Object.values(chats).forEach(chat => {
            pendingChats += chat.unread || 0;
        });

        $('totalUsers').textContent = totalUsers;
        $('totalConversions').textContent = totalConversions;
        $('totalMessages').textContent = totalMessages;
        $('pendingChats').textContent = pendingChats;

        this.loadSystemStats();
    },

    loadSystemStats() {
        const container = $('systemStats');
        if (!container) return;

        const users = Storage.load('users', {});
        const logs = Storage.load('logs', []);
        const chats = Storage.load('adminChats', {});

        const totalUsers = Object.keys(users).length;
        const activeUsers = Object.values(users).filter(u => !u.blocked).length;
        const blockedUsers = Object.values(users).filter(u => u.blocked).length;
        const totalLogs = logs.length;
        const totalChats = Object.keys(chats).length;

        container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div>
                    <div style="color: var(--gray); font-size: 13px;">Jami foydalanuvchilar</div>
                    <div style="font-size: 28px; font-weight: 700; color: #667eea; margin-top: 5px;">${totalUsers}</div>
                </div>
                <div>
                    <div style="color: var(--gray); font-size: 13px;">Faol</div>
                    <div style="font-size: 28px; font-weight: 700; color: #00ff64; margin-top: 5px;">${activeUsers}</div>
                </div>
                <div>
                    <div style="color: var(--gray); font-size: 13px;">Bloklangan</div>
                    <div style="font-size: 28px; font-weight: 700; color: #f5576c; margin-top: 5px;">${blockedUsers}</div>
                </div>
                <div>
                    <div style="color: var(--gray); font-size: 13px;">Jami loglar</div>
                    <div style="font-size: 28px; font-weight: 700; color: #4facfe; margin-top: 5px;">${totalLogs}</div>
                </div>
                <div>
                    <div style="color: var(--gray); font-size: 13px;">Chat foydalanuvchilari</div>
                    <div style="font-size: 28px; font-weight: 700; color: #f093fb; margin-top: 5px;">${totalChats}</div>
                </div>
                <div>
                    <div style="color: var(--gray); font-size: 13px;">Yuklab olish</div>
                    <div style="font-size: 28px; font-weight: 700; color: #ffd200; margin-top: 5px;">
                        ${(Object.keys(localStorage).length * 2 / 1024).toFixed(1)}KB
                    </div>
                </div>
            </div>
        `;
    },

    showTab(tabName) {
        this.currentTab = tabName;

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        ['usersTab', 'logsTab', 'chatsTab', 'settingsTab'].forEach(tab => {
            const element = $(tab);
            if (element) element.classList.add('hidden');
        });

        const selectedTab = $(`${tabName}Tab`);
        if (selectedTab) selectedTab.classList.remove('hidden');

        switch (tabName) {
            case 'users':
                this.loadUsers();
                break;
            case 'logs':
                this.loadLogs();
                break;
            case 'chats':
                this.loadChats();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    },

    loadUsers() {
        const users = Storage.load('users', {});
        const logs = Storage.load('logs', []);
        const container = $('usersContainer');

        if (!container) return;

        let html = '';

        if (Object.keys(users).length === 0) {
            html = '<div style="text-align: center; padding: 50px; color: var(--gray);">👥 Hozircha foydalanuvchilar yo\'q</div>';
        } else {
            for (const [username, userData] of Object.entries(users)) {
                const userLogs = logs.filter(log => log.user === username);
                const conversions = userLogs.filter(log => log.type === 'convert').length;
                const messages = userLogs.filter(log => log.type === 'message').length;
                const lastLogin = new Date(userData.lastLogin).toLocaleString('uz-UZ');

                const statusText = userData.blocked ? '🔴 Bloklangan' : '🟢 Faol';
                const actionBtn = userData.blocked ? 
                    `<button onclick="Admin.unblockUser('${username}')" class="btn-primary" style="padding: 8px 16px; font-size: 13px;">Blokdan chiqarish</button>` :
                    `<button onclick="Admin.blockUser('${username}')" class="btn-danger" style="padding: 8px 16px; font-size: 13px;">Bloklash</button>`;

                html += `
                    <div class="user-card">
                        <div style="display: flex; justify-content: space-between; align-items: start; gap: 20px;">
                            <div style="flex: 1;">
                                <h3 style="margin-bottom: 10px; font-size: 20px;">👤 ${username}</h3>
                                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 15px 0;">
                                    <div>
                                        <div style="color: var(--gray); font-size: 12px;">Status</div>
                                        <div style="font-weight: 600; margin-top: 3px;">${statusText}</div>
                                    </div>
                                    <div>
                                        <div style="color: var(--gray); font-size: 12px;">Oxirgi kirish</div>
                                        <div style="font-weight: 600; margin-top: 3px; font-size: 13px;">${lastLogin}</div>
                                    </div>
                                    <div>
                                        <div style="color: var(--gray); font-size: 12px;">Konversiyalar</div>
                                        <div style="font-weight: 600; margin-top: 3px; color: #667eea;">${conversions}</div>
                                    </div>
                                    <div>
                                        <div style="color: var(--gray); font-size: 12px;">Xabarlar</div>
                                        <div style="font-weight: 600; margin-top: 3px; color: #4facfe;">${messages}</div>
                                    </div>
                                    <div>
                                        <div style="color: var(--gray); font-size: 12px;">Jami kirishlar</div>
                                        <div style="font-weight: 600; margin-top: 3px; color: #00ff64;">${userData.totalLogins || 1}</div>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${actionBtn}
                                <button onclick="Admin.viewUserStats('${username}')" class="btn-primary" style="padding: 8px 16px; font-size: 13px;">📊 Statistika</button>
                                <button onclick="Admin.deleteUser('${username}')" class="btn-danger" style="padding: 8px 16px; font-size: 13px;">🗑️ O'chirish</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        container.innerHTML = html;
    },

    searchUsers() {
        const searchTerm = $('userSearch').value.toLowerCase();
        const users = Storage.load('users', {});

        if (!searchTerm) {
            this.loadUsers();
            return;
        }

        const filtered = Object.entries(users).filter(([username]) => 
            username.toLowerCase().includes(searchTerm)
        );

        if (filtered.length === 0) {
            $('usersContainer').innerHTML = '<div style="text-align: center; padding: 50px; color: var(--gray);">🔍 Foydalanuvchi topilmadi</div>';
        } else {
            this.loadUsers();
        }
    },

    blockUser(username) {
        if (!confirm(`${username} ni bloklaysizmi?`)) return;

        const users = Storage.load('users', {});
        if (users[username]) {
            users[username].blocked = true;
            Storage.save('users', users);
            
            Utils.log('admin', `User bloklandi: ${username}`, 'admin');
            Utils.notify(`${username} bloklandi!`, 'success');
            
            this.loadUsers();
            this.loadDashboard();
        }
    },

    unblockUser(username) {
        if (!confirm(`${username} ni blokdan chiqarasizmi?`)) return;

        const users = Storage.load('users', {});
        if (users[username]) {
            users[username].blocked = false;
            Storage.save('users', users);
            
            Utils.log('admin', `User blokdan chiqarildi: ${username}`, 'admin');
            Utils.notify(`${username} blokdan chiqarildi!`, 'success');
            
            this.loadUsers();
            this.loadDashboard();
        }
    },

    deleteUser(username) {
        if (!confirm(`${username} ni o'chirasizmi? Bu amalni qaytarib bo'lmaydi!`)) return;

        const users = Storage.load('users', {});
        if (users[username]) {
            delete users[username];
            Storage.save('users', users);
            
            Storage.remove(`stats_${username}`);
            Storage.remove(`chat_${username}`);
            
            Utils.log('admin', `User o'chirildi: ${username}`, 'admin');
            Utils.notify(`${username} o'chirildi!`, 'success');
            
            this.loadUsers();
            this.loadDashboard();
        }
    },

    viewUserStats(username) {
        const stats = Storage.load(`stats_${username}`, { files: 0, converts: 0, messages: 0 });
        const logs = Storage.load('logs', []).filter(log => log.user === username);

        alert(`📊 ${username} Statistikasi:\n\n` +
              `📁 Fayllar: ${stats.files}\n` +
              `🔄 Konvertlar: ${stats.converts}\n` +
              `💬 Xabarlar: ${stats.messages}\n` +
              `📋 Jami harakatlar: ${logs.length}`);
    },

    loadLogs() {
        const logs = Storage.load('logs', []);
        const container = $('logContainer');

        if (!container) return;

        if (logs.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 50px; color: var(--gray);">📋 Hozircha loglar yo\'q</div>';
            return;
        }

        const sortedLogs = logs.slice().reverse();
        
        let html = '';
        sortedLogs.slice(0, 200).forEach(log => {
            const typeIcons = {
                'login': '🔐',
                'logout': '🚪',
                'convert': '🔄',
                'file': '📁',
                'message': '💬',
                'admin': '🛡️',
                'error': '❌',
                'chat': '💬'
            };

            const icon = typeIcons[log.type] || '📝';
            
            html += `
                <div class="log-item">
                    <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px;">
                        <div style="display: flex; gap: 15px; align-items: center; flex: 1;">
                            <div style="font-size: 28px;">${icon}</div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; margin-bottom: 5px;">
                                    <span style="color: #667eea;">${log.user}</span> - ${log.action}
                                </div>
                                <div style="color: var(--gray); font-size: 13px;">${log.time}</div>
                            </div>
                        </div>
                        <div style="padding: 5px 12px; background: rgba(102, 126, 234, 0.1); border-radius: 6px; font-size: 12px; color: #667eea;">
                            ${log.type}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    filterLogs() {
        const filter = $('logFilter').value;
        const logs = Storage.load('logs', []);

        let filtered = logs;
        if (filter !== 'all') {
            filtered = logs.filter(log => log.type === filter);
        }

        this.loadLogs();
    },

    clearLogs() {
        if (!confirm('Barcha loglarni o\'chirasizmi?')) return;

        Storage.save('logs', []);
        Utils.notify('Loglar tozalandi!', 'success');
        this.loadLogs();
        this.loadDashboard();
    },

    loadChats() {
        const chats = Storage.load('adminChats', {});
        const usersList = $('chatUsersList');
        const messagesArea = $('chatMessagesArea');

        if (!usersList || !messagesArea) return;

        if (Object.keys(chats).length === 0) {
            usersList.innerHTML = '<div style="text-align: center; padding: 30px; color: var(--gray);">💬 Chat yo\'q</div>';
            return;
        }

        let html = '';
        for (const [username, chatData] of Object.entries(chats)) {
            const unread = chatData.unread || 0;
            const lastMsg = chatData.messages[chatData.messages.length - 1];
            const isActive = this.selectedChatUser === username;

            html += `
                <div class="chat-user-item ${isActive ? 'active' : ''}" onclick="Admin.selectChat('${username}')">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 5px;">
                        <strong>${username}</strong>
                        ${unread > 0 ? `<span class="badge">${unread}</span>` : ''}
                    </div>
                    <div style="font-size: 13px; color: var(--gray); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${lastMsg ? lastMsg.text.substring(0, 30) + '...' : 'Xabar yo\'q'}
                    </div>
                </div>
            `;
        }

        usersList.innerHTML = html;

        if (this.selectedChatUser) {
            this.loadChatMessages(this.selectedChatUser);
        }
    },

    selectChat(username) {
        this.selectedChatUser = username;
        this.loadChats();
        
        const chats = Storage.load('adminChats', {});
        if (chats[username]) {
            chats[username].unread = 0;
            Storage.save('adminChats', chats);
            this.loadDashboard();
        }
    },

    loadChatMessages(username) {
        const messagesArea = $('chatMessagesArea');
        if (!messagesArea) return;

        const chats = Storage.load('adminChats', {});
        const chatData = chats[username];

        if (!chatData || chatData.messages.length === 0) {
            messagesArea.innerHTML = `
                <div class="empty-chat">
                    <svg viewBox="0 0 24 24" width="60" height="60">
                        <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                    <p>Xabarlar yo'q</p>
                </div>
            `;
            return;
        }

        let html = '<div class="chat-messages">';
        chatData.messages.forEach(msg => {
            html += `
                <div class="chat-message ${msg.from}">
                    <div>${msg.text}</div>
                    <div style="font-size: 11px; opacity: 0.7; margin-top: 5px;">${msg.time}</div>
                </div>
            `;
        });
        html += '</div>';

        html += `
            <div class="admin-chat-input">
                <input type="text" id="adminMessageInput" placeholder="Javob yozing..." onkeypress="if(event.key==='Enter') Admin.sendAdminMessage()">
                <button onclick="Admin.sendAdminMessage()" class="btn-send">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </div>
        `;

        messagesArea.innerHTML = html;

        const chatMessages = messagesArea.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    },

    sendAdminMessage() {
        const input = $('adminMessageInput');
        if (!input || !this.selectedChatUser) return;

        const message = input.value.trim();
        if (!message) return;

        const chats = Storage.load('adminChats', {});
        const time = new Date().toLocaleString('uz-UZ', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
        });

        chats[this.selectedChatUser].messages.push({
            from: 'admin',
            text: message,
            time: time,
            timestamp: new Date().toISOString(),
            read: false
        });

        Storage.save('adminChats', chats);

        input.value = '';
        this.loadChatMessages(this.selectedChatUser);
        this.loadChats();

        Utils.log('admin', `${this.selectedChatUser} ga javob: ${message.substring(0, 30)}...`, 'admin');
        Utils.notify('Xabar yuborildi!', 'success');
    },

    loadSettings() {
        this.loadSystemStats();
    },

    exportData() {
        const data = {
            users: Storage.load('users', {}),
            logs: Storage.load('logs', []),
            chats: Storage.load('adminChats', {}),
            exported: new Date().toISOString(),
            version: '2.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-converter-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        Utils.log('admin', 'Ma\'lumotlar eksport qilindi', 'admin');
        Utils.notify('Ma\'lumotlar yuklab olindi!', 'success');
    },

    clearAllData() {
        const confirmation = prompt('DIQQAT! Barcha ma\'lumotlar o\'chadi. Davom etish uchun "DELETE" deb yozing:');
        
        if (confirmation === 'DELETE') {
            Storage.clearAll();
            Utils.notify('Barcha ma\'lumotlar o\'chirildi!', 'success');
            
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            Utils.notify('Bekor qilindi', 'error');
        }
    },

    refreshAll() {
        this.loadDashboard();
        
        switch (this.currentTab) {
            case 'users':
                this.loadUsers();
                break;
            case 'logs':
                this.loadLogs();
                break;
            case 'chats':
                this.loadChats();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }

        Utils.notify('Yangilandi!', 'success');
    },

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.loadDashboard();
            if (this.currentTab === 'chats') {
                this.loadChats();
            }
        }, 30000);
    },

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    // Admin will be initialized on login
});
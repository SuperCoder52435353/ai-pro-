/**
 * AI Pro Converter - Ultimate Authentication System
 * Version 2.0 - Enhanced Security & Features
 */

const CONFIG = {
    ADMIN_USER: 'agent',
    ADMIN_PASS: 'PASSWORDABDURAXMON',
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_TIME: 300000 // 5 minutes
};

// Global utilities
window.$ = (id) => document.getElementById(id);

const Storage = {
    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify({
                value: value,
                timestamp: Date.now()
            }));
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    },

    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            if (!data) return defaultValue;
            const parsed = JSON.parse(data);
            return parsed.value || defaultValue;
        } catch (error) {
            console.error('Storage load error:', error);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            return false;
        }
    },

    clearAll() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            return false;
        }
    }
};

const Utils = {
    notify(message, type = 'success') {
        const container = $('notificationContainer') || this.createNotificationContainer();
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.4s ease';
            setTimeout(() => notification.remove(), 400);
        }, 4000);
    },

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    },

    log(user, action, type = 'info') {
        const logs = Storage.load('logs', []);
        logs.push({
            user: user || 'unknown',
            action: action,
            type: type,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleString('uz-UZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        });

        if (logs.length > 2000) logs.shift();
        Storage.save('logs', logs);
    },

    showPage(pageId) {
        const pages = ['loginPage', 'mainApp', 'adminPanel'];
        pages.forEach(page => {
            const element = $(page);
            if (element) element.classList.add('hidden');
        });
        const targetPage = $(pageId);
        if (targetPage) targetPage.classList.remove('hidden');
    },

    showLoading(show = true) {
        const overlay = $('loadingOverlay');
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
};

const Auth = {
    currentUser: null,
    isAdmin: false,
    loginAttempts: {},

    init() {
        this.initParticles();
        this.checkRememberedUser();
        this.setupEventListeners();
        this.cleanupOldAttempts();
    },

    setupEventListeners() {
        const passwordInput = $('passwordInput');
        const usernameInput = $('usernameInput');
        
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.login();
            });
        }
        
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') $('passwordInput').focus();
            });
        }
    },

    checkRememberedUser() {
        const remembered = Storage.load('rememberedUser');
        if (remembered) {
            $('usernameInput').value = remembered;
            $('rememberMe').checked = true;
        }
    },

    cleanupOldAttempts() {
        const now = Date.now();
        for (const username in this.loginAttempts) {
            if (now - this.loginAttempts[username].time > CONFIG.LOCKOUT_TIME) {
                delete this.loginAttempts[username];
            }
        }
    },

    checkLockout(username) {
        if (!this.loginAttempts[username]) return false;
        
        const attempt = this.loginAttempts[username];
        const now = Date.now();
        
        if (attempt.count >= CONFIG.MAX_LOGIN_ATTEMPTS) {
            const timeLeft = CONFIG.LOCKOUT_TIME - (now - attempt.time);
            if (timeLeft > 0) {
                const minutes = Math.ceil(timeLeft / 60000);
                Utils.notify(`Bloklangan! ${minutes} daqiqadan keyin urinib ko'ring.`, 'error');
                return true;
            } else {
                delete this.loginAttempts[username];
                return false;
            }
        }
        return false;
    },

    recordAttempt(username, success = false) {
        if (success) {
            delete this.loginAttempts[username];
            return;
        }

        if (!this.loginAttempts[username]) {
            this.loginAttempts[username] = { count: 0, time: Date.now() };
        }
        
        this.loginAttempts[username].count++;
        this.loginAttempts[username].time = Date.now();
        
        const remaining = CONFIG.MAX_LOGIN_ATTEMPTS - this.loginAttempts[username].count;
        if (remaining > 0) {
            Utils.notify(`Noto'g'ri parol! ${remaining} urinish qoldi.`, 'warning');
        }
    },

    async login() {
        const username = $('usernameInput').value.trim();
        const password = $('passwordInput').value;

        if (!username || !password) {
            Utils.notify('Ism va parol kiriting!', 'error');
            return;
        }

        if (this.checkLockout(username)) {
            return;
        }

        Utils.showLoading(true);
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 500));

        // Admin login
        if (username === CONFIG.ADMIN_USER && password === CONFIG.ADMIN_PASS) {
            this.currentUser = username;
            this.isAdmin = true;
            this.recordAttempt(username, true);
            this.loginAdmin();
            Utils.showLoading(false);
            return;
        }

        // Check if user is blocked
        const users = Storage.load('users', {});
        if (users[username]?.blocked) {
            Utils.showLoading(false);
            Utils.notify('Siz bloklangansiz! Admin bilan bog\'laning.', 'error');
            Utils.log(username, 'Bloklangan user login urinishi', 'error');
            return;
        }

        // Regular user login (any password for non-admin)
        if (username !== CONFIG.ADMIN_USER) {
            this.currentUser = username;
            this.isAdmin = false;
            
            if (!users[username]) {
                users[username] = {
                    created: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    blocked: false,
                    totalLogins: 1
                };
            } else {
                users[username].lastLogin = new Date().toISOString();
                users[username].totalLogins = (users[username].totalLogins || 0) + 1;
            }
            Storage.save('users', users);

            if ($('rememberMe').checked) {
                Storage.save('rememberedUser', username);
            }

            this.recordAttempt(username, true);
            Utils.log(username, 'Tizimga kirdi', 'login');
            this.showMainApp();
            Utils.showLoading(false);
        } else {
            // Wrong admin password
            this.recordAttempt(username, false);
            Utils.showLoading(false);
        }
    },

    loginAdmin() {
        Utils.log(this.currentUser, 'Admin panelga kirdi', 'admin');
        Utils.notify('Admin panelga xush kelibsiz! 🛡️', 'success');
        Utils.showPage('adminPanel');
        
        // Initialize admin panel
        if (typeof Admin !== 'undefined') {
            Admin.init();
        }
    },

    showMainApp() {
        Utils.showPage('mainApp');
        $('currentUsername').textContent = this.currentUser;

        // Load user stats
        if (typeof Brain !== 'undefined') {
            Brain.loadUserStats(this.currentUser);
        }

        // AI greeting
        if (typeof AI !== 'undefined') {
            const greetings = [
                `Salom, ${this.currentUser}! 🚀 AI Pro Converter Ultimate tayyor!`,
                `Xush kelibsiz, ${this.currentUser}! 🔥 Professional konverter sizning xizmatingizda!`,
                `Assalomu alaykum, ${this.currentUser}! ✨ Qanday yordam bera olaman?`,
                `Hayrli kun, ${this.currentUser}! ⚡ Keling, fayllaringizni convert qilamiz!`
            ];

            const greeting = greetings[Math.floor(Math.random() * greetings.length)];
            AI.addMessage('ai', greeting + '<br><br>📁 Men sizga quyidagilarda yordam bera olaman:<br><br>✅ Excel, CSV → PDF, TXT, HTML, JSON<br>✅ Word → PDF, TXT, HTML<br>✅ PDF → Matn chiqarish<br>✅ TXT → PDF, DOCX, HTML<br>✅ PowerPoint, Rasmlar va boshqalar<br><br>💡 <strong>Tez yordam:</strong><br>• "yordam" - To\'liq qo\'llanma<br>• "formatlar" - Qo\'llab-quvvatlanadiganlar<br>• "qanday" - Qanday ishlatish<br>• "admin" - Admin bilan bog\'lanish<br><br>Savolingizni yozing yoki faylni yuklang! 😊');
        }

        Utils.notify(`Xush kelibsiz, ${this.currentUser}!`, 'success');
        
        // Check for unread admin messages
        if (typeof ChatWithAdmin !== 'undefined') {
            ChatWithAdmin.checkUnreadMessages();
        }
    },

    logout() {
        if (!confirm('Tizimdan chiqmoqchimisiz?')) return;

        Utils.log(this.currentUser, 'Tizimdan chiqdi', 'logout');

        this.currentUser = null;
        this.isAdmin = false;

        $('passwordInput').value = '';
        $('chatContainer').innerHTML = '';
        
        Utils.showPage('loginPage');
        Utils.notify('Xayr! Yana ko\'rishguncha 👋', 'success');
    },

    initParticles() {
        const canvas = $('particles');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = Math.min(100, Math.floor(window.innerWidth / 10));

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.radius = Math.random() * 2 + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(102, 126, 234, 0.5)';
                ctx.fill();
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(102, 126, 234, ${1 - distance / 100})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            requestAnimationFrame(animate);
        }

        animate();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }
};

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    
    // Set pdfjsLib worker
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
});
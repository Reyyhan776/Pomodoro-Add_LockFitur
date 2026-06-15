/* ═══════════════════════════════════════════════════════════════
   SessionStateManager & AccessController (OOP)
   Shared across all pages — loaded before each page's own JS
   ═══════════════════════════════════════════════════════════════ */

class SessionStateManager {
  static STORAGE_KEY = 'pom_session_state';

  static setState(mode, isRunning, timeLeft) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        mode: mode,
        isRunning: isRunning,
        timeLeft: timeLeft || 0,
        timestamp: Date.now()
      }));
    } catch (e) { /* silent */ }
  }

  static formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return m + ':' + s;
  }

  static modeLabel(mode) {
    return mode === 'focus' ? 'FOKUS' : mode === 'short' ? 'SHORT BREAK' : 'LONG BREAK';
  }

  static modeColor(mode) {
    return mode === 'focus' ? '#06b6d4' : mode === 'short' ? '#34d399' : '#a78bfa';
  }

  static clearState() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static getState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  static isPageRestricted(page) {
    const s = this.getState();
    if (!s || !s.isRunning) return false;
    if (s.mode === 'focus') {
      if (page === 'pomodoro') return false;
      return !['notes', 'aitutor'].includes(page);
    }
    if (s.mode === 'short') {
      if (page === 'pomodoro') return false;
      return true;
    }
    if (s.mode === 'long') return false;
    return false;
  }
}

class AccessController {
  constructor(currentPage) {
    this.currentPage = currentPage;
    this.sessionState = null;
    this._sidebarItems = [];
    this._countdownInterval = null;
  }

  init() {
    this.sessionState = SessionStateManager.getState();
    this._injectCountdownStyles();
    this._collectSidebarItems();
    this._applySidebarRestrictions();
    if (this._isRestricted()) {
      this._showOverlay();
    }
    this._syncCountdown();
    window.addEventListener('storage', (e) => {
      if (e.key === SessionStateManager.STORAGE_KEY) {
        this.refreshSidebar();
        this._syncCountdown();
      }
    });
    return true;
  }

  refreshSidebar() {
    this.sessionState = SessionStateManager.getState();
    this._sidebarItems.forEach(item => item.el.classList.remove('sb-locked'));
    this._applySidebarRestrictions();
    if (this._isRestricted()) {
      this._showOverlay();
    } else {
      this._hideOverlay();
    }
  }

  updateCountdownDisplay(timeLeft) {
    const el = document.getElementById('pom-countdown-badge');
    const text = document.getElementById('pom-countdown-badge-text');
    if (!el || !text) return;
    const s = SessionStateManager.getState();
    if (!s || !s.isRunning) { el.classList.remove('show'); return; }
    const label = SessionStateManager.modeLabel(s.mode);
    text.textContent = label + ' ' + SessionStateManager.formatTime(timeLeft);
    el.style.background = SessionStateManager.modeColor(s.mode) + '18';
    el.style.borderColor = SessionStateManager.modeColor(s.mode) + '44';
    el.style.color = SessionStateManager.modeColor(s.mode);
    el.classList.add('show');
  }

  _injectCountdownStyles() {
    if (document.getElementById('pom-countdown-style')) return;
    const style = document.createElement('style');
    style.id = 'pom-countdown-style';
    style.textContent = [
      '#pom-countdown-badge {',
      '  display: none;',
      '  align-items: center;',
      '  padding: 2px 10px;',
      '  border-radius: 6px;',
      '  border: 1px solid transparent;',
      '  font-size: 11px;',
      '  font-weight: 700;',
      '  font-family: "Plus Jakarta Sans", "JetBrains Mono", sans-serif;',
      '  letter-spacing: 0.4px;',
      '  transition: opacity 0.2s;',
      '  user-select: none;',
      '  white-space: nowrap;',
      '}',
      '#pom-countdown-badge.show { display: inline-flex; }',
      '#pom-countdown-badge-text { font-variant-numeric: tabular-nums; }',
    ].join('\n');
    document.head.appendChild(style);
  }

  _syncCountdown() {
    if (this.currentPage === 'pomodoro') return;
    this._stopCountdown();
    const s = SessionStateManager.getState();
    if (s && s.isRunning) {
      this._showCountdown();
    }
  }

  _showCountdown() {
    if (this.currentPage === 'pomodoro') return;
    let el = document.getElementById('pom-countdown-badge');
    if (!el) {
      el = document.createElement('div');
      el.id = 'pom-countdown-badge';
      el.innerHTML = '<span id="pom-countdown-badge-text"></span>';
      const title = document.querySelector('.header-title');
      if (title && title.parentElement) {
        title.parentElement.insertBefore(el, title.nextSibling);
      } else {
        const header = document.querySelector('.header');
        if (header) header.appendChild(el);
        else document.body.appendChild(el);
      }
    }
    const s = SessionStateManager.getState();
    if (!s) return;
    this._tick();
    this._countdownInterval = setInterval(() => this._tick(), 1000);
  }

  _tick() {
    const s = SessionStateManager.getState();
    if (!s || !s.isRunning) { this._hideCountdown(); return; }
    if (!s.timestamp) { this.updateCountdownDisplay(s.timeLeft || 0); return; }
    const elapsed = Math.floor((Date.now() - s.timestamp) / 1000);
    const estimated = Math.max(0, (s.timeLeft || 0) - elapsed);
    if (estimated <= 0 && (s.timeLeft || 0) > 0) {
      this._hideCountdown();
      return;
    }
    this.updateCountdownDisplay(estimated);
  }

  _hideCountdown() {
    this._stopCountdown();
    const el = document.getElementById('pom-countdown-badge');
    if (el) el.classList.remove('show');
  }

  _stopCountdown() {
    if (this._countdownInterval) {
      clearInterval(this._countdownInterval);
      this._countdownInterval = null;
    }
  }

  _collectSidebarItems() {
    this._sidebarItems = [];
    document.querySelectorAll('.sb-item').forEach(el => {
      const href = el.getAttribute('href');
      const page = this._pageFromHref(href);
      if (page) this._sidebarItems.push({ el, page });
    });
  }

  _isRestricted() {
    return SessionStateManager.isPageRestricted(this.currentPage);
  }

  _getMessage() {
    const s = this.sessionState;
    if (!s) return '';
    if (s.mode === 'focus') {
      return 'Hanya fitur Catatan (Notes) dan AI Tutor yang dapat diakses selama sesi <strong>Fokus</strong>. Tetap fokus pada materi belajarmu!';
    }
    if (s.mode === 'short') {
      return 'Semua fitur dikunci selama <strong>Short Break</strong>. Silakan istirahat sejenak sebelum kembali belajar.';
    }
    return '';
  }

  _showOverlay() {
    let overlay = document.getElementById('pom-access-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pom-access-overlay';
      overlay.className = 'pom-access-overlay';
      overlay.innerHTML = [
        '<div class="pom-access-card">',
        '  <div class="pom-access-icon">',
        '    <svg viewBox="0 0 24 24" fill="none" width="40" height="40">',
        '      <circle cx="12" cy="12" r="9" stroke="#f59e0b" stroke-width="1.8"/>',
        '      <path d="M12 8V13" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round"/>',
        '      <circle cx="12" cy="16" r="1" fill="#f59e0b"/>',
        '    </svg>',
        '  </div>',
        '  <h3 class="pom-access-title">Fitur Terkunci</h3>',
        '  <p class="pom-access-msg" id="pom-access-msg"></p>',
        '  <button class="pom-access-btn" onclick="window.location.href=\'../dashboard/index.html\'">',
        '    <svg viewBox="0 0 20 20" fill="none" width="14" height="14">',
        '      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>',
        '      <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>',
        '      <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>',
        '      <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/>',
        '    </svg>',
        '    Kembali ke Dashboard',
        '  </button>',
        '</div>'
      ].join('');
      document.body.appendChild(overlay);
    }
    document.getElementById('pom-access-msg').innerHTML = this._getMessage();
    overlay.classList.add('show');
  }

  _hideOverlay() {
    const overlay = document.getElementById('pom-access-overlay');
    if (overlay) overlay.classList.remove('show');
  }

  _applySidebarRestrictions() {
    this._sidebarItems.forEach(({ el: item, page }) => {
      if (SessionStateManager.isPageRestricted(page)) {
        item.classList.add('sb-locked');
      }
    });
  }

  _pageFromHref(href) {
    if (!href) return '';
    if (href.includes('dashboard')) return 'dashboard';
    if (href.includes('pomodoro')) return 'pomodoro';
    if (href.includes('note')) return 'notes';
    if (href.includes('quiz')) return 'quiz';
    if (href.includes('aitutor')) return 'aitutor';
    if (href.includes('profile')) return 'profile';
    return '';
  }
}

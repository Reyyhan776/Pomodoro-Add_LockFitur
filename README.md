# Laporan Perubahan Kode — Learning Assistant

## 1. Sistem Pembatasan Akses Berdasarkan Mode Timer

### Konsep
Setiap mode Pomodoro (Fokus / Short Break / Long Break) memiliki aturan akses berbeda ke fitur lain. Pembatasan hanya aktif saat timer benar-benar berjalan (`isRunning = true`).

### Aturan Akses

| Mode | Dashboard | Notes | Quiz AI | AI Tutor | Profile | Pomodoro |
|------|-----------|-------|---------|----------|---------|----------|
| **Fokus** (running) | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Short Break** (running) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Long Break** (running) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Semua mode** (pause/stop) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### File: `ui/shared/access-control.js`

#### `SessionStateManager.setState(mode, isRunning, timeLeft)`
- Menyimpan state ke localStorage key `pom_session_state`
- Parameter: mode (focus/short/long), status running, sisa waktu
- Juga menyimpan timestamp untuk estimasi countdown di halaman lain
- `isRunning` = `true` hanya saat timer benar-benar berjalan

#### `SessionStateManager.isPageRestricted(page)`
- Jika `!isRunning` → tidak ada pembatasan
- Mode `focus`: semua diblokir kecuali `notes`, `aitutor`, dan `pomodoro`
- Mode `short`: semua diblokir kecuali `pomodoro`
- Mode `long`: tidak ada pembatasan

#### `AccessController`
- `_applySidebarRestrictions()`: Menambahkan class `sb-locked` pada item sidebar yang dibatasi
- `refreshSidebar()`: Membersihkan dan menerapkan ulang pembatasan secara dinamis
- `_showOverlay()`: Menampilkan overlay "Fitur Terkunci" jika halaman itu sendiri dibatasi
- `_hideOverlay()`: Menyembunyikan overlay saat pembatasan dicabut

#### File: `ui/pomodoro/pomodoro.css`
- `.sb-item.sb-locked`: opacity 0.4, `pointer-events: none`, dan `::after` menampilkan emoji 🔒
- `.sb-locked .sb-label::after`: lock icon otomatis muncul via CSS pseudo-element

#### File: `ui/pomodoro/pomodoro.js`
- `startTimer()` → `SessionStateManager.setState(mode, true, timeLeft)` + `refreshSidebar()`
- `pauseTimer()` → `SessionStateManager.setState(mode, false, timeLeft)` + `refreshSidebar()`
- Interval timer → update state setiap detik

#### File: `ui/pomodoro/index.html`
- `window.accessCtrl` diekspos global untuk diakses dari `pomodoro.js`

---

## 2. Countdown Badge di Setiap Halaman

### Konsep
Badge kecil di header yang menampilkan countdown timer Pomodoro secara real-time, muncul di semua halaman **kecuali** halaman Pomodoro itu sendiri.

### Tampilan
```
[FOKUS 15:00]    — warna cyan
[SHORT BREAK 05:00]  — warna hijau
[LONG BREAK 15:00]   — warna ungu
```

### File: `ui/shared/access-control.js`

#### Injected CSS (`_injectCountdownStyles()`)
- Badge: `display: inline-flex`, `margin-left: auto` (mengikuti alur flex header)
- Ukuran: `padding: 2px 10px`, `font-size: 11px`
- Border + border-radius untuk tampilan pill
- Font monospace untuk angka (`font-variant-numeric: tabular-nums`)

#### `AccessController` Methods

| Method | Fungsi |
|--------|--------|
| `_showCountdown()` | Buat elemen badge (jika belum ada), sisipkan setelah `.header-title`, mulai interval tick |
| `_tick()` | Baca state → hitung estimasi → update display; stop jika timer selesai |
| `_hideCountdown()` | Hentikan interval + sembunyikan badge |
| `_syncCountdown()` | Hentikan interval lama → jika timer jalan, mulai ulang |
| `updateCountdownDisplay(timeLeft)` | Update teks & warna badge |

#### Estimasi Waktu (`_tick()`)
```
estimated = storedTimeLeft - ((Date.now() - storedTimestamp) / 1000)
```
Setiap detak, badge memperkirakan sisa waktu berdasarkan selisih waktu sejak update terakhir dari tab Pomodoro. Ketika tab Pomodoro mengupdate state (setiap detik), `storage` event memicu sinkronisasi ulang.

#### Sinkronisasi Antar Tab
- `storage` event listener pada `pom_session_state` → `_syncCountdown()`
- Interval lokal (`setInterval 1000ms`) menjaga akurasi di antara event storage

---

## 3. Perbaikan Layout Notes

### File: `ui/note/index.html`
- **Ditambahkan:** Ikon SVG dokumen sebelum judul di `.header-left` (konsisten dengan halaman Dashboard, Pomodoro, dll.)

### File: `ui/note/note.css`
| Properti | Sebelum | Sesudah |
|----------|---------|---------|
| `.header-left` | (tidak ada) | `display: flex; align-items: center; gap: 10px` |
| `.header-title` font-size | 18px | 15px |
| `.header-title` color | (tidak ada) | `var(--t)` |
| `.header-title` letter-spacing | -0.4px | -0.3px |
| `.header-right` gap | 14px | 12px |

---

## 4. Struktur File yang Diubah

```
ui/
├── shared/
│   └── access-control.js        ← MODIFIED: pembatasan akses + countdown badge
│
├── pomodoro/
│   ├── index.html               ← MODIFIED: hapus mini browser & link input, global accessCtrl
│   ├── pomodoro.css             ← MODIFIED: hapus mini browser, link, perbaiki scroll + sb-locked
│   └── pomodoro.js              ← MODIFIED: hapus PomodoroLinkManager, tambah setState timeLeft
│
└── note/
    ├── index.html               ← MODIFIED: tambah icon notes di header
    └── note.css                 ← MODIFIED: samakan header layout dengan halaman lain
```

### Ringkasan Perubahan per File

| File | Baris Ditambah | Baris Dihapus | Total Perubahan |
|------|---------------|---------------|-----------------|
| `access-control.js` | ~90 | ~30 | +60 |
| `pomodoro/index.html` | 1 | ~55 | -54 |
| `pomodoro/pomodoro.css` | ~15 | ~280 | -265 |
| `pomodoro/pomodoro.js` | ~15 | ~120 | -105 |
| `note/index.html` | ~7 | 0 | +7 |
| `note/note.css` | ~6 | ~2 | +4 |

---

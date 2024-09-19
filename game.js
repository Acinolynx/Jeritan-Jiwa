// Mendapatkan elemen kanvas dan konteksnya
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const countdownScreen = document.getElementById('countdownScreen');
const countdownTimer = document.getElementById('countdownTimer');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverMessage = document.getElementById('gameOverMessage');
const startOverlay = document.getElementById('startOverlay');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

// Deklarasi gambar
const characterImage = new Image();
const backgroundImage = new Image();

// Memuat gambar
characterImage.src = 'Asset/Character.png';  
backgroundImage.src = 'Asset/BG Game.png';  

let characterX = 1;  // Posisi awal karakter di sumbu X
let characterY = canvas.height - 100;  // Posisi awal karakter di bagian bawah kanvas
const characterWidth = 100;
const characterHeight = 100;

let isGameRunning = false;
let timeLeft = 60;  // Durasi permainan
let countdown = 3;  // Countdown sebelum permainan dimulai
let audioContext, analyser, microphone, dataArray;

const inclineAngle = Math.PI / 8.5;  // Kemiringan tanjakan
const characterSpeed = 1;  // Kecepatan gerak karakter saat ada suara
const gravity = 2;  // Kecepatan jatuh karakter saat tidak ada suara
const finishLineY = 10;  // Posisi akhir (atas tanjakan)

// Pastikan gambar dimuat sebelum memulai
characterImage.onload = () => {
    draw();  // Gambar ulang kanvas ketika gambar selesai dimuat
};

backgroundImage.onload = () => {
    draw();  // Gambar ulang kanvas ketika background selesai dimuat
};

// Fungsi untuk memulai countdown saat klik tombol mulai
startButton.addEventListener('click', () => {
    if (!isGameRunning) {
        startOverlay.style.display = 'none'; // Menghilangkan overlay saat game dimulai
        startCountdown();
    }
});

// Fungsi untuk memulai countdown saat klik tombol mulai ulang
restartButton.addEventListener('click', () => {
    if (!isGameRunning) {
        resetGame(); // Mulai ulang jika game over
        startCountdown();
    }
});

// Mulai countdown
function startCountdown() {
    countdownScreen.style.display = 'flex';
    countdownTimer.textContent = countdown;

    const countdownInterval = setInterval(() => {
        countdown -= 1;
        countdownTimer.textContent = countdown;

        if (countdown <= 0) {
            clearInterval(countdownInterval);
            countdownScreen.style.display = 'none';
            startGame();
        }
    }, 1000);
}

// Mulai game
function startGame() {
    resetGame();
    isGameRunning = true;
    startTimer();
    initializeAudio();
}

// Reset semua variabel
function resetGame() {
    characterX = 1;  // Reset posisi karakter di X
    characterY = canvas.height - 100;  // Reset posisi karakter di Y
    timeLeft = 10;  // Reset timer
    isGameRunning = false;
    countdown = 3; // Reset countdown
    draw();  // Gambar ulang kanvas
    startOverlay.style.display = 'none';  // Sembunyikan overlay klik untuk memulai game
    gameOverScreen.style.display = 'none'; // Pastikan gameOverScreen disembunyikan
}

// Akhiri game dengan hasil menang/kalah
function endGame(result) {
    isGameRunning = false;
    gameOverScreen.style.display = 'flex';
    gameOverMessage.textContent = result === 'win' ? 'Kamu Menang! Beban hidupmu hilang!' : 'Kamu Kalah! Beban hidupmu berat banget!.';
}

// Gambar latar belakang dan karakter Sysiphus
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gambar background canvas
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // Gambar karakter Sysiphus mendorong batu
    ctx.drawImage(characterImage, characterX, characterY, characterWidth, characterHeight);
}

// Inisialisasi audio untuk mendeteksi mikrofon
function initializeAudio() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            microphone = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            microphone.connect(analyser);

            dataArray = new Uint8Array(analyser.frequencyBinCount);
            detectVolume();  
        })
        .catch(function(err) {
            console.error('Gagal mengakses mikrofon: ', err);
        });
}

// Deteksi volume suara
function detectVolume() {
    if (!isGameRunning) {
        requestAnimationFrame(detectVolume);
        return;
    }

    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const averageVolume = sum / dataArray.length;

    // Gerakkan karakter jika volume tinggi
    if (averageVolume > 10) {
        characterX += characterSpeed * Math.cos(inclineAngle);  // Gerak maju di X
        characterY -= characterSpeed * Math.sin(inclineAngle);  // Gerak naik di Y

        // Cek jika karakter melewati garis finish
        if (characterY <= finishLineY) {
            endGame('win');  // Menang jika sampai di garis finish
        }
    } else {
        // Turun kembali saat tidak ada suara
        characterX -= gravity * Math.cos(inclineAngle);
        characterY += gravity * Math.sin(inclineAngle);

        // Cek jika karakter berada di batas bawah kanvas
        if (characterY > canvas.height - characterHeight) {
            characterY = canvas.height - characterHeight;  // Batas bawah agar tidak keluar canvas
        }
        // Cek jika karakter berada di batas kiri kanvas
        if (characterX < 0) {
            characterX = 0;  // Batas kiri agar tidak keluar canvas
        }
        // Cek jika karakter berada di batas kanan kanvas
        if (characterX + characterWidth > canvas.width) {
            characterX = canvas.width - characterWidth;  // Batas kanan agar tidak keluar canvas
        }
    }
    
    draw();
    requestAnimationFrame(detectVolume);
}

// Mulai timer game
function startTimer() {
    const timerInterval = setInterval(() => {
        if (!isGameRunning) {
            clearInterval(timerInterval);
            return;
        }
        timeLeft -= 1;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame('lose');  // Kalah jika waktu habis
        }
    }, 1000);
}

// Gambar awal
draw();

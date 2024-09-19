// Mendapatkan elemen kanvas dan konteksnya
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.createElement('div');  // No explicit score display for simplicity
const countdownScreen = document.getElementById('countdownScreen');
const countdownTimer = document.getElementById('countdownTimer');
const gameOverScreen = document.getElementById('gameOverScreen');
const gameOverMessage = document.getElementById('gameOverMessage');

// Deklarasi gambar
const characterImage = new Image();
const boxImage = new Image();
const backgroundImage = new Image();

// Memuat gambar
characterImage.src = 'Asset/Character.png'; // Ganti dengan path gambar karakter Anda
boxImage.src = 'Asset/batu.png'; // Ganti dengan path gambar kotak Anda
backgroundImage.src = 'Asset/BG Game.png'; // Ganti dengan path gambar background canvas Anda

let boxX = 75;
let boxY = canvas.height / 2 - 25;
const boxWidth = 50;
const boxHeight = 50;

let characterX = 25;
let characterY = canvas.height / 2 - 40;
const characterWidth = 30;
const characterHeight = 70;

let isBoxMoving = false;
let isGameRunning = false;
let gameStartTime = null;

let timeLeft = 10;  // Game duration
let countdown = 3;  // Countdown before game starts
let audioContext, analyser, microphone, dataArray;

// Fungsi untuk memulai countdown saat klik kanvas
canvas.addEventListener('click', () => {
    if (!isGameRunning) {
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
    characterX = 25;
    boxX = 75;
    isBoxMoving = false;
    gameStartTime = null;
    isGameRunning = false;
    gameOverScreen.style.display = 'none';
    draw();
}

// Akhiri game dengan hasil menang/kalah
function endGame(result) {
    isGameRunning = false;
    gameOverScreen.style.display = 'flex';
    gameOverMessage.textContent = result === 'win' ? 'You Win!' : 'You Lose!';
}

// Gambar latar belakang, karakter, dan kotak
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gambar background canvas
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // Gambar karakter
    ctx.drawImage(characterImage, characterX, characterY, characterWidth, characterHeight);

    // Gambar kotak
    ctx.drawImage(boxImage, boxX, boxY, boxWidth, boxHeight);
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
    if (averageVolume > 50) {
        characterX += 5;
        if (detectCollision()) {
            isBoxMoving = true;
        }
        if (isBoxMoving) {
            boxX += 5;
            if (boxX + boxWidth >= canvas.width) {
                endGame('win');
            }
            if (characterX + characterWidth >= canvas.width) {
                characterX = canvas.width - characterWidth;
            }
        }
    }
    draw();
    requestAnimationFrame(detectVolume);
}

// Deteksi tabrakan antara karakter dan kotak
function detectCollision() {
    return characterX + characterWidth >= boxX && characterX <= boxX + boxWidth;
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
            if (boxX + boxWidth < canvas.width) {
                endGame('lose');
            }
        }
    }, 1000);
}

// Gambar awal
draw();

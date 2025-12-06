// Canvas ve context ayarları
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const gameOverScreen = document.getElementById('gameOver');
const startScreen = document.getElementById('startScreen');
const restartBtn = document.getElementById('restartBtn');
const startBtn = document.getElementById('startBtn');
const finalScoreElement = document.getElementById('finalScore');

// Oyun ayarları
canvas.width = 400;
canvas.height = 400;
const gridSize = 20;
const tileCount = canvas.width / gridSize;

// Oyun durumu
let gameRunning = false;
let gameLoop;
let snake = [{ x: 10, y: 10 }];
let food = {};
let superFood = null;
let speedFood = null;
let dx = 0;
let dy = 0;
let nextDx = 0; // Bir sonraki hareket için yön
let nextDy = 0;
let score = 0;
let lastSuperFoodScore = 0; // Son süper meyvenin oluşturulduğu skor
let lastSpeedFoodScore = 0; // Son hız meyvesinin oluşturulduğu skor
let gameSpeed = 150; // Oyun hızı (milisaniye)
let highScore = localStorage.getItem('snakeHighScore') || 0;

// Yüksek skoru göster
highScoreElement.textContent = highScore;

// Yemek oluştur
function createFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    
    // Yemek yılanın üzerinde olmamalı
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            createFood();
            return;
        }
    }
    
    // Süper meyve varsa, normal yemek süper meyvenin üzerinde olmamalı
    if (superFood && food.x === superFood.x && food.y === superFood.y) {
        createFood();
        return;
    }
    
    // Hız meyvesi varsa, normal yemek hız meyvesinin üzerinde olmamalı
    if (speedFood && food.x === speedFood.x && food.y === speedFood.y) {
        createFood();
        return;
    }
}

// Süper meyve oluştur
function createSuperFood() {
    superFood = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    
    // Süper meyve yılanın üzerinde olmamalı
    for (let segment of snake) {
        if (segment.x === superFood.x && segment.y === superFood.y) {
            createSuperFood();
            return;
        }
    }
    
    // Süper meyve normal yemeğin üzerinde olmamalı
    if (superFood.x === food.x && superFood.y === food.y) {
        createSuperFood();
        return;
    }
    
    // Süper meyve hız meyvesinin üzerinde olmamalı
    if (speedFood && superFood.x === speedFood.x && superFood.y === speedFood.y) {
        createSuperFood();
        return;
    }
}

// Hız meyvesi oluştur
function createSpeedFood() {
    speedFood = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    
    // Hız meyvesi yılanın üzerinde olmamalı
    for (let segment of snake) {
        if (segment.x === speedFood.x && segment.y === speedFood.y) {
            createSpeedFood();
            return;
        }
    }
    
    // Hız meyvesi normal yemeğin üzerinde olmamalı
    if (speedFood.x === food.x && speedFood.y === food.y) {
        createSpeedFood();
        return;
    }
    
    // Hız meyvesi süper meyvenin üzerinde olmamalı
    if (superFood && speedFood.x === superFood.x && speedFood.y === superFood.y) {
        createSpeedFood();
        return;
    }
}

// Çizim fonksiyonları
function drawGame() {
    clearCanvas();
    drawSnake();
    drawFood();
    if (superFood) {
        drawSuperFood();
    }
    if (speedFood) {
        drawSpeedFood();
    }
    drawScore();
}

function clearCanvas() {
    ctx.fillStyle = '#1a252f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    // Yılanın vücudunu çiz (yuvarlak segmentler)
    for (let i = 1; i < snake.length; i++) {
        const x = snake[i].x * gridSize + gridSize / 2;
        const y = snake[i].y * gridSize + gridSize / 2;
        const radius = (gridSize - 2) / 2;
        
        // Ana vücut segmenti
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Vücut segmentlerine hafif gölge efekti
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Yılanın başını çiz
    if (snake.length > 0) {
        const headX = snake[0].x * gridSize + gridSize / 2;
        const headY = snake[0].y * gridSize + gridSize / 2;
        const headRadius = (gridSize - 2) / 2;
        
        // Baş gövdesi (biraz daha büyük)
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Başın üst kısmı (daha koyu)
        ctx.fillStyle = '#229954';
        ctx.beginPath();
        ctx.arc(headX - 2, headY - 2, headRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // Gözler (yönüne göre)
        ctx.fillStyle = '#ffffff';
        if (dx === 1) { // Sağa gidiyor
            ctx.beginPath();
            ctx.arc(headX + 3, headY - 3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(headX + 3, headY + 3, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (dx === -1) { // Sola gidiyor
            ctx.beginPath();
            ctx.arc(headX - 3, headY - 3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(headX - 3, headY + 3, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (dy === -1) { // Yukarı gidiyor
            ctx.beginPath();
            ctx.arc(headX - 3, headY - 3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(headX + 3, headY - 3, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (dy === 1) { // Aşağı gidiyor
            ctx.beginPath();
            ctx.arc(headX - 3, headY + 3, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(headX + 3, headY + 3, 2, 0, Math.PI * 2);
            ctx.fill();
        } else { // Başlangıçta (hareket yok)
            ctx.beginPath();
            ctx.arc(headX - 3, headY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(headX + 3, headY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Göz bebekleri
        ctx.fillStyle = '#000000';
        if (dx === 1) {
            ctx.beginPath();
            ctx.arc(headX + 3, headY - 3, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(headX + 3, headY + 3, 1, 0, Math.PI * 2);
            ctx.fill();
        } else if (dx === -1) {
            ctx.beginPath();
            ctx.arc(headX - 3, headY - 3, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(headX - 3, headY + 3, 1, 0, Math.PI * 2);
            ctx.fill();
        } else if (dy === -1) {
            ctx.beginPath();
            ctx.arc(headX - 3, headY - 3, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(headX + 3, headY - 3, 1, 0, Math.PI * 2);
            ctx.fill();
        } else if (dy === 1) {
            ctx.beginPath();
            ctx.arc(headX - 3, headY + 3, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(headX + 3, headY + 3, 1, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(headX - 3, headY - 2, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(headX + 3, headY - 2, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawFood() {
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function drawSuperFood() {
    // Süper meyve için altın/sarı renk ve parıltı efekti
    const gradient = ctx.createRadialGradient(
        superFood.x * gridSize + gridSize / 2,
        superFood.y * gridSize + gridSize / 2,
        0,
        superFood.x * gridSize + gridSize / 2,
        superFood.y * gridSize + gridSize / 2,
        gridSize / 2
    );
    gradient.addColorStop(0, '#ffd700');
    gradient.addColorStop(0.5, '#ffed4e');
    gradient.addColorStop(1, '#ffa500');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(superFood.x * gridSize, superFood.y * gridSize, gridSize - 2, gridSize - 2);
    
    // Parlaklık efekti için beyaz nokta
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(superFood.x * gridSize + 3, superFood.y * gridSize + 3, 6, 6);
}

function drawSpeedFood() {
    // Hız meyvesi için mavi/mor renk ve parıltı efekti
    const gradient = ctx.createRadialGradient(
        speedFood.x * gridSize + gridSize / 2,
        speedFood.y * gridSize + gridSize / 2,
        0,
        speedFood.x * gridSize + gridSize / 2,
        speedFood.y * gridSize + gridSize / 2,
        gridSize / 2
    );
    gradient.addColorStop(0, '#9b59b6');
    gradient.addColorStop(0.5, '#8e44ad');
    gradient.addColorStop(1, '#6c3483');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(speedFood.x * gridSize, speedFood.y * gridSize, gridSize - 2, gridSize - 2);
    
    // Parlaklık efekti için beyaz nokta
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(speedFood.x * gridSize + 3, speedFood.y * gridSize + 3, 6, 6);
}

function drawScore() {
    scoreElement.textContent = score;
}

// Yılan hareketi
function moveSnake() {
    // Bir sonraki yönü uygula (eğer varsa)
    if (nextDx !== 0 || nextDy !== 0) {
        // Yılanın uzunluğu 1'den fazlaysa, zıt yöne dönmeyi engelle
        if (snake.length > 1) {
            const canChangeDirection = !(
                (dx === 1 && nextDx === -1) || // Sağdan sola
                (dx === -1 && nextDx === 1) || // Soldan sağa
                (dy === 1 && nextDy === -1) || // Aşağıdan yukarı
                (dy === -1 && nextDy === 1)    // Yukarıdan aşağı
            );
            
            if (canChangeDirection) {
                dx = nextDx;
                dy = nextDy;
                nextDx = 0;
                nextDy = 0;
            } else {
                // Zıt yöne dönmeye çalışıyorsa, nextDx ve nextDy'yi sıfırla
                nextDx = 0;
                nextDy = 0;
            }
        } else {
            // Yılanın uzunluğu 1 ise, herhangi bir yöne dönebilir
            dx = nextDx;
            dy = nextDy;
            nextDx = 0;
            nextDy = 0;
        }
    }
    
    // Eğer henüz hareket yoksa, hareket etme
    if (dx === 0 && dy === 0) {
        return;
    }
    
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Duvar çarpışması kontrolü
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }
    
    // Kendine çarpma kontrolü (baş hariç)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }
    
    snake.unshift(head);
    
    let foodEaten = false;
    
    // Hız meyvesi yeme kontrolü
    if (speedFood && head.x === speedFood.x && head.y === speedFood.y) {
        speedFood = null;
        lastSpeedFoodScore = score;
        foodEaten = true;
        
        // Oyun hızını artır (interval süresini azalt, minimum 50ms)
        gameSpeed = Math.max(50, gameSpeed - 10);
        
        // Oyun döngüsünü yeniden başlat
        clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, gameSpeed);
    }
    // Süper meyve yeme kontrolü
    else if (superFood && head.x === superFood.x && head.y === superFood.y) {
        score += 20;
        superFood = null;
        lastSuperFoodScore = score;
        foodEaten = true;
        
        // Yılanı 2 birim uzat
        const tail = snake[snake.length - 1];
        snake.push({ x: tail.x, y: tail.y });
        snake.push({ x: tail.x, y: tail.y });
        
        // Yüksek skor güncelleme
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
    }
    // Normal yemek yeme kontrolü
    else if (head.x === food.x && head.y === food.y) {
        score += 10;
        createFood();
        foodEaten = true;
        
        // Yüksek skor güncelleme
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }
        
        // Her 30 skorda bir süper meyve oluştur
        if (score - lastSuperFoodScore >= 30 && !superFood) {
            createSuperFood();
        }
        
        // Her 20 skorda bir hız meyvesi oluştur
        if (score - lastSpeedFoodScore >= 20 && !speedFood) {
            createSpeedFood();
        }
    }
    
    if (!foodEaten) {
        snake.pop();
    }
}

// Oyun döngüsü
function gameStep() {
    if (!gameRunning) return;
    
    moveSnake();
    drawGame();
}

// Klavye kontrolleri
document.addEventListener('keydown', (e) => {
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;
    
    const keyPressed = e.keyCode;
    
    // Ok tuşları için scroll'u engelle
    if (keyPressed === LEFT_KEY || keyPressed === RIGHT_KEY || 
        keyPressed === UP_KEY || keyPressed === DOWN_KEY) {
        e.preventDefault();
    }
    
    if (!gameRunning) return;
    
    // Mevcut yönü kontrol et (hem dx/dy hem de nextDx/nextDy)
    const currentDx = nextDx !== 0 ? nextDx : dx;
    const currentDy = nextDy !== 0 ? nextDy : dy;
    
    const goingUp = currentDy === -1;
    const goingDown = currentDy === 1;
    const goingRight = currentDx === 1;
    const goingLeft = currentDx === -1;
    
    // Yeni yönü nextDx/nextDy'ye kaydet (bir sonraki adımda uygulanacak)
    if (keyPressed === LEFT_KEY && !goingRight) {
        nextDx = -1;
        nextDy = 0;
    }
    
    if (keyPressed === UP_KEY && !goingDown) {
        nextDx = 0;
        nextDy = -1;
    }
    
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        nextDx = 1;
        nextDy = 0;
    }
    
    if (keyPressed === DOWN_KEY && !goingUp) {
        nextDx = 0;
        nextDy = 1;
    }
});

// Oyun başlatma
function startGame() {
    // Önceki oyun döngüsünü temizle
    if (gameLoop) {
        clearInterval(gameLoop);
    }
    
    gameRunning = true;
    snake = [{ x: 10, y: 10 }];
    dx = 0;
    dy = 0;
    nextDx = 0;
    nextDy = 0;
    score = 0;
    lastSuperFoodScore = 0;
    lastSpeedFoodScore = 0;
    superFood = null;
    speedFood = null;
    gameSpeed = 150; // Hızı sıfırla
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    createFood();
    drawGame();
    
    gameLoop = setInterval(gameStep, gameSpeed);
}

// Oyun bitirme
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Yeniden başlatma
function restartGame() {
    startGame();
}

// Buton event listener'ları
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);

// İlk çizim
drawGame();
createFood();


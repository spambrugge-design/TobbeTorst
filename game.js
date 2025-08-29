// 1. GRUNDLÄGGANDE INSTÄLLNINGAR
// ===============================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- NYTT: Logik för skalning ---
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;

// Sätt canvasens interna upplösning
canvas.width = BASE_WIDTH;
canvas.height = BASE_HEIGHT;

// Hämta UI-element
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');

// Spelvariabler
let score = 0;
let lives = 3;
let isGameOver = false;
// Positionerna kommer nu att beräknas dynamiskt
const baseBarPositions = [80, 205, 330, 455];
let barPositions = [...baseBarPositions]; // Skapa en kopia att jobba med

// Ladda bilder (samma som förut)
const playerImage = new Image(); playerImage.src = 'otto.png';
const playerImage2 = new Image(); playerImage2.src = 'otto2.png'; 
const beerImage = new Image(); beerImage.src = 'ol.png';

let imagesLoaded = 0;
function onImageLoad() {
    imagesLoaded++;
    if (imagesLoaded === 3) {
        restartGame();
    }
}
playerImage.onload = onImageLoad; playerImage2.onload = onImageLoad; beerImage.onload = onImageLoad;


// 2. SPELOBJEKT
// ===============================
const player = {
    x: 30,
    y: barPositions[0],
    width: 60,
    height: 90,
    currentLane: 0,
    isDrinking: false,
    drinkingTimer: 0,
    drinkingDuration: 15,
    
    draw: function() {
        let imageToDraw = this.isDrinking ? playerImage2 : playerImage;
        ctx.drawImage(imageToDraw, this.x, this.y - this.height / 2, this.width, this.height);
    },
    
    moveUp: function() {
        if (this.currentLane > 0) {
            this.currentLane--;
            this.y = barPositions[this.currentLane];
        }
    },
    moveDown: function() {
        if (this.currentLane < barPositions.length - 1) {
            this.currentLane++;
            this.y = barPositions[this.currentLane];
        }
    }
};

let beers = [];
let baseBeerSpeed = 3;
let beerSpeed = 3;
let beerSpawnRate = 120;
let frameCount = 0;

function spawnBeer() {
    const lane = Math.floor(Math.random() * barPositions.length);
    beers.push({
        x: canvas.width,
        y: barPositions[lane],
        width: 40,
        height: 60,
    });
}

// 3. KONTROLLER (Tangentbord OCH Touch)
// ============================

// Behåll tangentbord för datorer
document.addEventListener('keydown', function(event) {
    if (isGameOver && event.code === 'Space') {
        restartGame();
        return;
    }
    if (!isGameOver) {
        if (event.key === 'ArrowUp' || event.key === 'w') player.moveUp();
        else if (event.key === 'ArrowDown' || event.key === 's') player.moveDown();
    }
});

// --- NYTT: Lyssna efter Touch-händelser ---
function handleTouch(event) {
    // Förhindra att sidan zoomar eller scrollar
    event.preventDefault(); 
    
    if (isGameOver) {
        restartGame();
        return;
    }

    const touchY = event.touches[0].clientY;
    const canvasRect = canvas.getBoundingClientRect(); // Få canvas position på skärmen
    const canvasMiddle = canvasRect.top + canvasRect.height / 2;

    if (touchY < canvasMiddle) {
        player.moveUp();
    } else {
        player.moveDown();
    }
}

// Koppla funktionen till både canvas och game over-skärmen
canvas.addEventListener('touchstart', handleTouch);
gameOverScreen.addEventListener('touchstart', handleTouch);


// 4. FUNKTIONER
// ============================
function restartGame() {
    score = 0;
    lives = 3;
    beerSpeed = baseBeerSpeed;
    beerSpawnRate = 120;
    beers = [];
    isGameOver = false;
    player.currentLane = 0;
    player.y = barPositions[0];
    player.isDrinking = false;
    frameCount = 0;
    
    updateUI();
    gameOverScreen.classList.add('hidden');
    if(animationFrameId) cancelAnimationFrame(animationFrameId); 
    gameLoop();
}

function updateUI() {
    scoreElement.textContent = score;
    livesElement.textContent = lives;
}

function drawBars() {
    ctx.fillStyle = '#8b4513';
    for (const y of barPositions) {
        // Justera tjockleken på bardisken baserat på originalstorleken
        ctx.fillRect(0, y + 20, canvas.width, 10);
    }
}

// 5. SPELLOOPEN
// ==================================
let animationFrameId;

function gameLoop() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBars();

    if (player.isDrinking) {
        player.drinkingTimer--;
        if (player.drinkingTimer <= 0) {
            player.isDrinking = false;
        }
    }
    player.draw();

    frameCount++;
    if (frameCount % Math.floor(beerSpawnRate) === 0) {
        spawnBeer();
        beerSpeed += 0.1;
        if (beerSpawnRate > 40) beerSpawnRate -= 2;
    }

    for (let i = beers.length - 1; i >= 0; i--) {
        let beer = beers[i];
        beer.x -= beerSpeed;
        ctx.drawImage(beerImage, beer.x, beer.y - beer.height / 2, beer.width, beer.height);
        
        if (beer.x < player.x + player.width &&
            beer.x + beer.width > player.x &&
            Math.abs(beer.y - player.y) < 10) {
            score += 10;
            beers.splice(i, 1);
            player.isDrinking = true;
            player.drinkingTimer = player.drinkingDuration;
        } else if (beer.x + beer.width < 0) {
            lives--;
            beers.splice(i, 1);
            if (lives <= 0) {
                lives = 0;
                isGameOver = true;
                finalScoreElement.textContent = score;
                gameOverScreen.classList.remove('hidden');
            }
        }
    }
    
    updateUI();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Starta spelet
updateUI();
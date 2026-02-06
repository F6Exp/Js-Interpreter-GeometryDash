var display = require('display');
var keyboard = require('keyboard');

var width = display.width;
var height = display.height;
var fillScreen = display.fill;
var drawFillRect = display.drawFillRect;
var drawString = display.drawString;
var setTextSize = display.setTextSize;

var getSelPress = keyboard.getSelPress;
var getEscPress = keyboard.getEscPress;

var screenWidth = width();
var screenHeight = height();

var bgColor = 0x000000;
var playerColor = 0x00FF00;
var floorColor = 0x006600;
var platformColor = 0xAAAAAA;
var platformSpikeColor = 0xFFFFFF;
var floorSpikeColor = 0xFFFFFF;
var obstacleColor = 0x00CC00;

var floorHeight = 6;
var floorY = screenHeight - 30;

var playerWidth = 12;
var playerHeight = 12;
var playerX = 50;
var playerY = floorY - playerHeight;
var playerVelY = 0;

var jumpSpeed = -7.5;
var gravity = 0.6;

var spikeSizes = [
    { w: 6, h: 6 },
    { w: 10, h: 10 },
    { w: 14, h: 14 }
];

var floorSpikes = [];
var floorSpikeTimer = 0;
var nextFloorSpike = 18 + Math.random() * 72;
var spikeSpeed = 4;

var platforms = [];
var platformSpikes = [];
var platformSpeed = 4;
var platformSpawnTimer = 0;
var nextPlatformSpawn = 20 + Math.random() * 40;

var obstacles = [];
var obstacleTimer = 0;
var nextObstacle = 60 + Math.random() * 60;
var obstacleHeights = [12, 24];
var obstacleWidth = 60;

var score = 0;

var gameRunning = true;
var gameOver = false;

function drawPlayer() {
    drawFillRect(playerX, playerY, playerWidth, playerHeight, playerColor);
}

function drawSpike(s) {
    for (var i = 0; i < s.w; i++) {
        var lh = Math.floor(s.h * (1 - Math.abs(i - s.w / 2) / (s.w / 2)));
        drawFillRect(s.x + i, s.y + s.h - lh, 1, lh, s.color);
    }
}

function drawPlatforms() {
    for (var i = 0; i < platforms.length; i++) {
        var p = platforms[i];
        drawFillRect(p.x, p.y, p.w, p.h, platformColor);
    }
}

function drawPlatformSpikes() {
    for (var i = 0; i < platformSpikes.length; i++) {
        drawSpike(platformSpikes[i]);
    }
}

function drawFloorSpikes() {
    for (var i = 0; i < floorSpikes.length; i++) drawSpike(floorSpikes[i]);
}

function drawObstacles() {
    for (var i = 0; i < obstacles.length; i++) {
        var o = obstacles[i];
        drawFillRect(o.x, o.y, o.w, o.h, obstacleColor);
    }
}

function updatePlayer() {
    var onGround = playerY + playerHeight >= floorY;

    for (var i = 0; i < platforms.length; i++) {
        var p = platforms[i];
        var playerBottom = playerY + playerHeight;

        if (
            playerVelY >= 0 &&
            playerBottom >= p.y &&
            playerBottom <= p.y + playerVelY + 2 &&
            playerX + playerWidth > p.x &&
            playerX < p.x + p.w
        ) {
            playerY = p.y - playerHeight;
            playerVelY = 0;
            onGround = true;
        }
    }

    for (var i = 0; i < obstacles.length; i++) {
        var o = obstacles[i];
        if (
            playerX + playerWidth > o.x + 2 &&
            playerX < o.x + o.w - 2 &&
            playerY + playerHeight >= o.y &&
            playerY + playerHeight <= o.y + 6
        ) {
            onGround = true;
            playerY = o.y - playerHeight;
            playerVelY = 0;
        }
    }

    if (getSelPress() && onGround) playerVelY = jumpSpeed;

    playerVelY += gravity;
    if (playerVelY > 10) playerVelY = 10;
    playerY += playerVelY;

    if (playerY + playerHeight > floorY) {
        playerY = floorY - playerHeight;
        playerVelY = 0;
    }
}

function updateFloorSpikes() {
    floorSpikeTimer++;
    if (floorSpikeTimer >= nextFloorSpike) {
        floorSpikeTimer = 0;
        nextFloorSpike = 18 + Math.random() * 72;

        var sz = spikeSizes[Math.floor(Math.random() * spikeSizes.length)];
        floorSpikes.push({
            x: screenWidth,
            y: floorY - sz.h,
            w: sz.w,
            h: sz.h,
            color: floorSpikeColor
        });
    }

    for (var i = floorSpikes.length - 1; i >= 0; i--) {
        var s = floorSpikes[i];
        s.x -= spikeSpeed;

        if (s.x + s.w < 0) {
            floorSpikes.splice(i, 1);
            score++;
            continue;
        }

        if (
            playerX < s.x + s.w &&
            playerX + playerWidth > s.x &&
            playerY < s.y + s.h &&
            playerY + playerHeight > s.y
        ) {
            gameOver = true;
            gameRunning = false;
        }
    }
}

function spawnPlatform() {
    var width = 100;
    var height = 8;
    var x = screenWidth;

    var spikeBelow = floorSpikes[Math.floor(Math.random() * floorSpikes.length)];
    var y = spikeBelow ? spikeBelow.y - height - 12 : floorY - 50;

    platforms.push({ x: x, y: y, w: width, h: height });

    if (Math.random() < 0.5) {
        var sz = spikeSizes[Math.floor(Math.random() * spikeSizes.length)];
        platformSpikes.push({
            x: x + Math.floor((width - sz.w) / 2),
            y: y - sz.h,
            w: sz.w,
            h: sz.h,
            color: platformSpikeColor
        });
    }
}

function updatePlatforms() {
    platformSpawnTimer++;
    if (platformSpawnTimer >= nextPlatformSpawn) {
        platformSpawnTimer = 0;
        nextPlatformSpawn = 18 + Math.random() * 60;
        spawnPlatform();
    }

    for (var i = platforms.length - 1; i >= 0; i--) {
        platforms[i].x -= platformSpeed;
        if (platforms[i].x + platforms[i].w < 0) platforms.splice(i, 1);
    }

    for (var i = platformSpikes.length - 1; i >= 0; i--) {
        var s = platformSpikes[i];
        s.x -= platformSpeed;
        if (s.x + s.w < 0) platformSpikes.splice(i, 1);

        if (
            playerX < s.x + s.w &&
            playerX + playerWidth > s.x &&
            playerY < s.y + s.h &&
            playerY + playerHeight > s.y
        ) {
            gameOver = true;
            gameRunning = false;
        }
    }
}

function spawnObstacle() {
    var h = obstacleHeights[Math.floor(Math.random() * obstacleHeights.length)];
    obstacles.push({
        x: screenWidth,
        y: floorY - h,
        w: obstacleWidth,
        h: h
    });
}

function updateObstacles() {
    obstacleTimer++;
    if (obstacleTimer >= nextObstacle) {
        obstacleTimer = 0;
        nextObstacle = 60 + Math.random() * 60;
        spawnObstacle();
    }

    for (var i = obstacles.length - 1; i >= 0; i--) {
        var o = obstacles[i];
        o.x -= platformSpeed;

        if (o.x + o.w < 0) {
            obstacles.splice(i, 1);
            score++;
            continue;
        }

        if (
            playerX + playerWidth > o.x &&
            playerX < o.x + 2 &&
            playerY + playerHeight > o.y &&
            playerY < o.y + o.h
        ) {
            gameOver = true;
            gameRunning = false;
        }
    }
}

function drawGame() {
    fillScreen(bgColor);
    drawPlayer();
    drawFloorSpikes();
    drawPlatforms();
    drawPlatformSpikes();
    drawObstacles();
    drawFillRect(0, floorY, screenWidth, floorHeight, floorColor);

    setTextSize(1);
    drawString("Score: " + score, 5, 5);

    if (gameOver) {
        drawString("GAME OVER", screenWidth / 2 - 30, screenHeight / 2 - 10);
        drawString("Press Select", screenWidth / 2 - 35, screenHeight / 2 + 5);
    }
}

function resetGame() {
    playerY = floorY - playerHeight;
    playerVelY = 0;
    platforms = [];
    platformSpikes = [];
    floorSpikes = [];
    obstacles = [];
    score = 0;
    gameRunning = true;
    gameOver = false;
    platformSpawnTimer = 0;
    nextPlatformSpawn = 20 + Math.random() * 40;
}

fillScreen(bgColor);
setTextSize(2);
drawString("Geometry Dash", 30, 30);
setTextSize(3);
drawString("Made by EXP", 20, 70);
setTextSize(1);
drawString("Press Select to Start", 35, 110);

keyboard.setLongPress(true);
while (!getSelPress()) delay(20);

resetGame();

while (true) {
    if (gameRunning) {
        updatePlayer();
        updateFloorSpikes();
        updatePlatforms();
        updateObstacles();
    } else if (gameOver && getSelPress()) {
        resetGame();
        delay(300);
    }

    drawGame();
    if (getEscPress()) break;
    delay(16);
}

keyboard.setLongPress(false);

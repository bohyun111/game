// 게임 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 플레이어(티모) 설정
const playerImage = new Image();
playerImage.src = 'images/티모.png';
let playerImageLoaded = false;

playerImage.onload = () => {
  playerImageLoaded = true;
};

// 플레이어 초기 위치 및 크기 설정
const playerWidth = 120;
const playerHeight = 120;
let playerX = canvas.width / 2 - playerWidth / 2;
let playerY = canvas.height / 2 - playerHeight / 2;

// 히트박스 설정
const hitboxWidth = 100;
const hitboxHeight = 110;

// 배경 음악 설정
const backgroundMusic = new Audio('music/롤배경음악.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

// 첫 번째 환영 음악 설정
const welcomeMusic = new Audio('music/롤첫_환영음.mp3');
welcomeMusic.volume = 0.5;

// 음소거 버튼 설정
const muteButton = document.getElementById('muteButton');
let isMuted = false;

muteButton.addEventListener('click', () => {
  if (isMuted) {
    backgroundMusic.play();
    muteButton.textContent = '음소거';
  } else {
    backgroundMusic.pause();
    muteButton.textContent = '음악 켜기';
  }
  isMuted = !isMuted;
});

// 볼륨 슬라이더 설정
const volumeSlider = document.getElementById('volumeSlider');
const volumeLabel = document.getElementById('volumeLabel');

volumeSlider.addEventListener('input', (e) => {
  const volume = e.target.value / 100;
  backgroundMusic.volume = volume;
  volumeLabel.textContent = `${e.target.value}%`; // 백틱으로 문자열 감싸기
});

let score = 0; // 점수 초기화
const scoreLabel = document.getElementById('scoreLabel'); // HTML에서 점수 표시할 요소

// 점수 증가 함수 (1초마다 호출)
function increaseScore() {
  score += 1; // 1초마다 1점 추가
  scoreLabel.textContent = `점수: ${score}`; // 화면에 점수 업데이트
}


// 엔딩 메시지 창
const endingMessage = document.getElementById('endingMessage');

// 엔딩 메시지 표시 함수
function showEndingMessage(message) {
  endingMessage.querySelector('p').textContent = message;
  endingMessage.style.display = 'block'; // 메시지 창 표시
}

// 플레이어 이동 변수
let moveUp = false;
let moveDown = false;
let moveLeft = false;
let moveRight = false;

// 적 관련 설정
let enemies = [];
const enemySize = 80;
const enemySpeed = 0.25;

// 적 이미지 설정
const enemyImage = new Image();
enemyImage.src = 'images/적이미지.png';
let enemyImageLoaded = false;

enemyImage.onload = () => {
  enemyImageLoaded = true;
};

// Q 공격 설정
let qCooldown = false;
const qSpeed = 3;
let qProjectiles = [];
const qCooldownTime = 3000; // 쿨타임 시간 (밀리초)
let qCooldownTimer = 0; // 쿨타임 타이머

// 쿨타임 표시용 텍스트
const qCooldownText = document.getElementById('qCooldownText');

// Q 발사체 이미지
const qProjectileImage = new Image();
qProjectileImage.src = 'images/q스킬이미지.png';

// 게임 종료 상태 변수
let isGameOver = false;
let gameLoopId;

// 게임 종료 함수
function endGame() {
  if (isGameOver) return;

  isGameOver = true;
  cancelAnimationFrame(gameLoopId);

  backgroundMusic.pause();
  showEndingMessage('게임 종료! 티모는 적들에게 패배했습니다. 다음엔 더 잘해보세요!');
}

// 게임 리셋 함수
function resetGame() {
  isGameOver = false;
  playerX = canvas.width / 2 - playerWidth / 2;
  playerY = canvas.height / 2 - playerHeight / 2;
  enemies = [];
  qProjectiles = [];
  endingMessage.style.display = 'none';
  score = 0; // 점수 초기화
  scoreLabel.textContent = `점수: ${score}`; // 점수 UI 초기화
  endingMessage.style.display = 'none';

  // 게임 시작 시 환영음 재생
  welcomeMusic.play();

  backgroundMusic.play();
  gameLoop();
}

// 적 생성 함수
function spawnEnemy() {
  const randomSide = Math.floor(Math.random() * 4);
  let enemyX, enemyY;

  if (randomSide === 0) {
    enemyX = Math.random() * canvas.width;
    enemyY = -enemySize;
  } else if (randomSide === 1) {
    enemyX = Math.random() * canvas.width;
    enemyY = canvas.height + enemySize;
  } else if (randomSide === 2) {
    enemyX = -enemySize;
    enemyY = Math.random() * canvas.height;
  } else {
    enemyX = canvas.width + enemySize;
    enemyY = Math.random() * canvas.height;
  }

  enemies.push({ x: enemyX, y: enemyY });
}

// 플레이어 그리기 함수
function drawPlayer() {
  if (playerImageLoaded) {
    ctx.drawImage(playerImage, playerX, playerY, playerWidth, playerHeight);
  }
}

// 적 그리기 및 이동 함수
function drawEnemies() {
  enemies.forEach((enemy, index) => {
    if (enemyImageLoaded) {
      const scale = enemySize / Math.max(enemyImage.width, enemyImage.height);
      const newWidth = enemyImage.width * scale;
      const newHeight = enemyImage.height * scale;

      ctx.drawImage(enemyImage, enemy.x, enemy.y, newWidth, newHeight);
    } else {
      ctx.fillStyle = 'red';
      ctx.fillRect(enemy.x, enemy.y, enemySize, enemySize);
    }

    const dx = playerX - enemy.x;
    const dy = playerY - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const directionX = dx / distance;
    const directionY = dy / distance;

    enemy.x += directionX * enemySpeed;
    enemy.y += directionY * enemySpeed;

    if (
      enemy.x < playerX + hitboxWidth &&
      enemy.x + enemySize > playerX &&
      enemy.y < playerY + hitboxHeight &&
      enemy.y + enemySize > playerY
    ) {
      endGame();
    }
  });
}

// 플레이어 이동 함수
function updatePlayerPosition() {
  const speed = 1.0;
  if (moveUp && playerY > 0) playerY -= speed;
  if (moveDown && playerY + hitboxHeight < canvas.height) playerY += speed;
  if (moveLeft && playerX > 0) playerX -= speed;
  if (moveRight && playerX + hitboxWidth < canvas.width) playerX += speed;
}

// Q 공격 발사 함수
function shootQ() {
  if (qCooldown) return;

  qCooldown = true;
  qCooldownTimer = Date.now(); // 쿨타임 시작

  // 쿨타임 텍스트 초기화 (숫자 0으로)
  qCooldownText.textContent = '0s';

  // Q 발사체 생성
  for (let i = 0; i < 20; i++) {
    const randomXDirection = Math.random() * 2 - 1;
    const randomYDirection = Math.random() * 2 - 1;

    const qProjectile = {
      x: playerX + playerWidth / 2 - 5,
      y: playerY + playerHeight / 2 - 5,
      width: 20,
      height: 20,
      direction: { x: randomXDirection, y: randomYDirection },
    };
    qProjectiles.push(qProjectile);
  }
}

// 쿨타임 표시 함수 (Q 스킬의 남은 시간 업데이트)
function updateQCooldown() {
  if (qCooldown) {
    const timeElapsed = Date.now() - qCooldownTimer;  // 경과 시간 계산
    const timeRemaining = qCooldownTime - timeElapsed;  // 남은 시간 계산

    if (timeRemaining <= 0) {
      qCooldown = false;
      qCooldownText.textContent = '0s';  // 쿨타임이 끝나면 0초로 표시
    } else {
      qCooldownText.textContent = `${Math.ceil(timeRemaining / 1000)}s`;  // 템플릿 리터럴로 초 단위 표시
    }
  }
}


let wCooldown = false;
const wCooldownTime = 10000; // W 스킬 쿨타임 시간 (밀리초)
let wCooldownTimer = 0; // 쿨타임 타이머
const wCooldownText = document.getElementById('wCooldownText');

function updateWCooldown() {
  if (wCooldown) {
    const timeElapsed = Date.now() - wCooldownTimer;
    const timeRemaining = wCooldownTime - timeElapsed;

    if (timeRemaining <= 0) {
      wCooldown = false;
      wCooldownText.textContent = '0s'; // 쿨타임이 끝나면 0으로 표시
    } else {
      wCooldownText.textContent = `${Math.ceil(timeRemaining / 1000)}s`; // 템플릿 리터럴 사용 (백틱으로 감싸기)
    }
  }
}


function useWSkill() {
  if (wCooldown) return; // 이미 쿨타임 중이면 실행되지 않음

  wCooldown = true;
  wCooldownTimer = Date.now(); // 쿨타임 시작

  // W 스킬 발동 로직 (예: 이동속도 증가 등)
  console.log("W 스킬 사용됨!");

  moveSpeed = 3.0;

  setTimeout(() => {
    moveSpeed = 1.0; // 속도 복귀
  }, speedBoostDuration);

  setTimeout(() => {
    wCooldown = false; // 쿨타임 종료
    wCooldownText.textContent = '0s'; // 쿨타임 표시 초기화
  }, wCooldownTime);
  updateWCooldown();
}

  

// 키 입력 이벤트에 W 스킬 추가
document.addEventListener('keydown', (event) => {
  if (event.key === 'w') {
    useWSkill(); // W 키가 눌리면 W 스킬 사용
  }
});

// Q 공격 그리기 및 충돌 처리
function drawQProjectiles() {
  qProjectiles.forEach((qProjectile, qIndex) => {
    if (qProjectileImage.complete) {
      ctx.drawImage(qProjectileImage, qProjectile.x, qProjectile.y, qProjectile.width, qProjectile.height);
    }

    qProjectile.x += qProjectile.direction.x * qSpeed;
    qProjectile.y += qProjectile.direction.y * qSpeed;

    if (
      qProjectile.y < 0 ||
      qProjectile.y > canvas.height ||
      qProjectile.x < 0 ||
      qProjectile.x > canvas.width
    ) {
      qProjectiles.splice(qIndex, 1);
    }

    enemies.forEach((enemy, eIndex) => {
      if (
        qProjectile.x < enemy.x + enemySize &&
        qProjectile.x + qProjectile.width > enemy.x &&
        qProjectile.y < enemy.y + enemySize &&
        qProjectile.y + qProjectile.height > enemy.y
      ) {
        enemies.splice(eIndex, 1);
        qProjectiles.splice(qIndex, 1);
      }
    });
  });
}

let moveSpeed = 1.2; // 기본 이동 속도
let speedBoostDuration = 5000; // 5초 (5000ms)
let speedBoostTimer = null; // 타이머를 추적할 변수

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') moveUp = true;
  if (e.key === 'ArrowDown') moveDown = true;
  if (e.key === 'ArrowLeft') moveLeft = true;
  if (e.key === 'ArrowRight') moveRight = true;
  
  if (e.key === 'q') {
    console.log("Q key pressed"); // Q 키가 눌렸을 때 확인
    shootQ(); // Q 발사
  }
  
  if (e.key === 'w') { // W 키가 눌리면 이동 속도 증가
    if (!speedBoostTimer) { // 타이머가 설정되지 않았을 경우에만 동작
      useWSkill(); // W 스킬 사용
    }
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp') moveUp = false;
  if (e.key === 'ArrowDown') moveDown = false;
  if (e.key === 'ArrowLeft') moveLeft = false;
  if (e.key === 'ArrowRight') moveRight = false;
});

// 플레이어 이동 함수에서 moveSpeed 사용
function updatePlayerPosition() {
  if (moveUp && playerY > 0) playerY -= moveSpeed;
  if (moveDown && playerY + hitboxHeight < canvas.height) playerY += moveSpeed;
  if (moveLeft && playerX > 0) playerX -= moveSpeed;
  if (moveRight && playerX + hitboxWidth < canvas.width) playerX += moveSpeed;
}

let enemySpawnRate = 0.003;

// 게임 루프
function gameLoop() {
  if (isGameOver) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height); // 캔버스 지우기
  updateQCooldown(); // Q 쿨타임 업데이트
  updateWCooldown(); // W 쿨타임 업데이트
  drawPlayer(); // 플레이어 그리기
  drawEnemies(); // 적 그리기
  drawQProjectiles(); // Q 발사체 그리기
  updatePlayerPosition(); // 플레이어 위치 업데이트
  increaseScore();
  
  // 적 생성 확률을 시간에 따라 점차적으로 증가
  if (Math.random() < enemySpawnRate) {
    spawnEnemy(); // 적 생성
  }

  // 적 생성 확률 증가 (최대값을 0.1로 설정)
  if (enemySpawnRate < 0.3 ) { 
    enemySpawnRate += 0.00005; // 증가 속도 조절
  }

  gameLoopId = requestAnimationFrame(gameLoop); // 게임 루프 재귀
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

resetGame();
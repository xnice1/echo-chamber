let timeLeft = 60;
let timerText;
let timerEvent;
let postImageDisplay;
let fullGameData;
let currentLevel = 1;
let transitionTitle;
let transitionSub;
let avatar;
let verifiedBadge;
let gameOverContainer;
let gameOverText;
let finalScoreText;
let gameOverImage;
let leaderboardText;
let leaderboardContainer;
let restartBtnBg;

const API_BASE = 'http://localhost:8000/api/v1';
let playerId = null;
let playerDisplayName = 'Guest';

const config = {
    type: Phaser.AUTO,
    width: 430,
    height: 932,
    backgroundColor: '#F5F8FA',
    scene: {
        preload: preload,
        create: create
    }
};

const game = new Phaser.Game(config);

let truthScore = 50;
let engageScore = 50;
let currentPostIndex = 0;
let postData = [];

let postCard;
let authorTextDisplay;
let timeTextDisplay;
let bodyTextDisplay;
let truthBar;
let engageBar;
let isGameOver = false;
let gameOverTime = 0;

function preload() {
    this.load.json('level1', 'data/data.json');

    for (let i = 1; i <= 20; i++) {
        this.load.image('avatar' + i, 'assets/avatars/avatar' + i + '.jpg');
    }

    this.load.image('verified', 'assets/ui/verified.jpg');

    this.load.image('systemWarning', 'assets/ui/system_warning.jpg');
    this.load.image('winImg', 'assets/ui/Win.jpg');
    this.load.image('shiftOverImg', 'assets/ui/ShiftOver.png');
    this.load.image('Fake_Gym_Achievement.png', 'assets/ui/Fake_Gym_Achievement.png');
    this.load.image('Street_Protest.png', 'assets/ui/Street_Protest.png');
    this.load.image('Weather_Disaster.png', 'assets/ui/Weather_Disaster.png');
    this.load.image('Weather.png', 'assets/ui/Weather.png');
    this.load.image('Construction_Work.png', 'assets/ui/Construction_Work.png');
    this.load.image('Garden.png', 'assets/ui/Garden.png');

    // Load sounds
    this.load.audio('swipe', 'assets/sounds/Swipe.mp3');
    this.load.audio('right', 'assets/sounds/Right.mp3');
    this.load.audio('wrong', 'assets/sounds/Wrong.mp3');
    this.load.audio('timeIsUp', 'assets/sounds/TimeIsUp.mp3');
    this.load.audio('lose', 'assets/sounds/Lose.mp3');
    this.load.audio('levelComplete', 'assets/sounds/LevelComplete.mp3');
}

function create() {
    // Reset game state
    timeLeft = 60;
    truthScore = 50;
    engageScore = 50;
    currentPostIndex = 0;
    currentLevel = 1;
    isGameOver = false;

    this.input.keyboard.removeAllListeners();

    fullGameData = this.cache.json.get('level1');
    postData = fullGameData.posts;

    timerText = this.add.text(215, 160, '0:60', { fontFamily: 'Inter', fontSize: '32px', fill: '#111827', fontStyle: 'bold' }).setOrigin(0.5);

    timerEvent = this.time.addEvent({
        delay: 1000,
        callback: () => {
            timeLeft--;
            timerText.setText(`0:${timeLeft < 10 ? '0' : ''}${timeLeft}`);
            if (timeLeft <= 0) {
                this.sound.play('timeIsUp');
                triggerGameOver("TIME'S UP! Shift Over.", false);
            }
        },
        callbackScope: this,
        loop: true
    });

    this.add.text(20, 45, 'Truth', { fontFamily: 'Inter', fontSize: '14px', fill: '#9CA3AF' });
    this.add.rectangle(20, 65, 300, 20, 0xD1D5DB).setOrigin(0, 0).setAlpha(0.28);
    truthBar = this.add.rectangle(20, 65, 192, 20, 0x22C55E).setOrigin(0, 0);

    this.add.text(20, 95, 'Engagement', { fontFamily: 'Inter', fontSize: '14px', fill: '#9CA3AF' });
    this.add.rectangle(20, 115, 300, 20, 0xD1D5DB).setOrigin(0, 0).setAlpha(0.28);
    engageBar = this.add.rectangle(20, 115, 192, 20, 0xEF4444).setOrigin(0, 0);

    let graphics = this.make.graphics();

    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(0, 0, 382, 456, 32);
    graphics.lineStyle(1, 0x000000, 0.1);
    graphics.strokeRoundedRect(0, 0, 382, 456, 32);
    graphics.generateTexture('cardBg', 382, 456);
    graphics.clear();

    graphics.fillStyle(0xE5E7EB, 1);
    graphics.fillRoundedRect(0, 0, 325, 319, 32);
    graphics.generateTexture('innerBg', 325, 319);
    graphics.clear();

    graphics.fillStyle(0x7F1D1D, 1); // Dark red color
    graphics.fillRoundedRect(0, 0, 400, 700, 32); // Increased size to 700 height
    graphics.generateTexture('popupBgTex', 400, 700);
    graphics.clear();

    let bgImage = this.add.image(0, 0, 'cardBg');
    let innerImage = this.add.image(0, 40, 'innerBg');

    avatar = this.add.image(-140, -170, 'avatar1').setDisplaySize(60, 60);
    let avatarFrameImage = this.add.image(-140, -170, 'avatarFrame').setDisplaySize(60, 60);

    authorTextDisplay = this.add.text(-90, -180, 'Username', {
        fontFamily: 'Inter', fontSize: '20px', fill: '#111827', fontStyle: 'bold'
    });

    timeTextDisplay = this.add.text(100, -175, '2 mins ago', {
        fontFamily: 'Inter', fontSize: '12px', fill: '#9CA3AF'
    });

    verifiedBadge = this.add.image(0, -170, 'verified').setDisplaySize(20, 20);
    verifiedBadge.setVisible(false);

    bodyTextDisplay = this.add.text(-140, -90, 'Loading...', {
        fontFamily: 'Inter', fontSize: '24px', fill: '#000000',
        wordWrap: { width: 280 }
    });


    postImageDisplay = this.add.image(0, -10, '').setDisplaySize(280, 160);
    postImageDisplay.setVisible(false);

    postCard = this.add.container(215, 494, [bgImage, innerImage, avatar, authorTextDisplay, verifiedBadge, timeTextDisplay, postImageDisplay, bodyTextDisplay]);

    postCard.setSize(382, 600);
    postCard.setInteractive({ draggable: true });

    transitionTitle = this.add.text(215, 420, '', { fontFamily: 'Inter', fontSize: '56px', fill: '#111827', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0);
    transitionSub = this.add.text(215, 480, '', { fontFamily: 'Inter', fontSize: '24px', fill: '#9CA3AF' }).setOrigin(0.5).setAlpha(0);
    showTransition("LEVEL 1", "The Bots & Spam");

    graphics.fillStyle(0x6B7280, 1); // Gray-500 color
    graphics.fillRoundedRect(0, 0, 200, 50, 12);
    graphics.generateTexture('btnBg', 200, 50);
    graphics.clear();

    let popupBg = this.add.image(0, 0, 'popupBgTex');
    gameOverImage = this.add.image(0, -210, 'systemWarning').setDisplaySize(350, 220);

    gameOverText = this.add.text(0, -10, '', {
        fontFamily: 'Inter',
        fontSize: '24px',
        fill: '#ffffff',
        align: 'center',
        wordWrap: { width: 340 },
        fontStyle: 'bold'
    }).setOrigin(0.5);

    finalScoreText = this.add.text(0, 130, '', {
        fontFamily: 'Inter',
        fontSize: '20px',
        fill: '#D1D5DB',
        align: 'center',
        lineSpacing: 10
    }).setOrigin(0.5);

    restartBtnBg = this.add.image(0, 310, 'btnBg');
    restartBtnBg.setInteractive({ useHandCursor: true });
    restartBtnBg.disableInteractive(); // Disable by default

    let restartBtnText = this.add.text(0, 310, 'RESTART SHIFT', {
        fontFamily: 'Inter', fontSize: '18px', fill: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    restartBtnBg.on('pointerdown', () => {
        postCard.scene.scene.restart();
    });

    leaderboardText = this.add.text(0, -120, '', {
        fontFamily: 'Courier New',
        fontSize: '18px',
        fill: '#ffffff',
        align: 'left',
        lineSpacing: 8
    }).setOrigin(0.5, 0);

    let leaderboardPopupBg = this.add.image(0, 0, 'popupBgTex');
    let lbTitle = this.add.text(0, -300, 'GLOBAL LEADERBOARD', {
        fontFamily: 'Inter', fontSize: '28px', fill: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    let closeBtnBg = this.add.image(0, 310, 'btnBg').setInteractive({ useHandCursor: true });
    let closeBtnText = this.add.text(0, 310, 'CLOSE', {
        fontFamily: 'Inter', fontSize: '18px', fill: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    closeBtnBg.on('pointerdown', () => {
        leaderboardContainer.setVisible(false);
        gameOverContainer.setVisible(true);
    });

    leaderboardContainer = this.add.container(215, 494, [leaderboardPopupBg, lbTitle, leaderboardText, closeBtnBg, closeBtnText]);
    leaderboardContainer.setDepth(110);
    leaderboardContainer.setVisible(false);

    let lbBtnBg = this.add.image(0, 240, 'btnBg').setInteractive({ useHandCursor: true });
    let lbBtnText = this.add.text(0, 240, 'LEADERBOARD', {
        fontFamily: 'Inter', fontSize: '18px', fill: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    lbBtnBg.on('pointerdown', () => {
        gameOverContainer.setVisible(false);
        leaderboardContainer.setVisible(true);
        leaderboardContainer.setScale(0.7);
        this.tweens.add({ targets: leaderboardContainer, scale: 1, duration: 200, ease: 'Back.easeOut' });
    });

    gameOverContainer = this.add.container(215, 494, [popupBg, gameOverImage, gameOverText, finalScoreText, restartBtnBg, restartBtnText, lbBtnBg, lbBtnText]);
    gameOverContainer.setDepth(100);
    gameOverContainer.setVisible(false);

    initPlayer();


    this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
        gameObject.x = dragX;
        gameObject.y = 494 + (dragY - 494) * 0.1;
        gameObject.angle = (gameObject.x - 215) * 0.05;
    });

    this.input.on('dragend', function (pointer, gameObject) {
        if (gameObject.x < 120) {
            handleSwipe(false);
        } else if (gameObject.x > 310) {
            handleSwipe(true);
        } else {
            gameObject.scene.tweens.add({
                targets: gameObject,
                x: 215,
                y: 494,
                angle: 0,
                duration: 200,
                ease: 'Back.easeOut'
            });
        }
    });
    this.input.keyboard.on('keydown-LEFT', () => { handleSwipe(false); });
    this.input.keyboard.on('keydown-RIGHT', () => { handleSwipe(true); });
}

function loadNextPost() {
    if (currentPostIndex >= postData.length) {
        if (currentLevel === 1) {
            currentLevel = 2;
            postData = fullGameData.level_2_posts;
            currentPostIndex = 0;
            timeLeft = 60;
            postCard.scene.sound.play('levelComplete');
            showTransition("LEVEL 2", "The Deepfakes");
            return;

        } else if (currentLevel === 2) {
            currentLevel = 3;
            postData = fullGameData.level_3_posts;
            currentPostIndex = 0;
            timeLeft = 60;
            postCard.scene.sound.play('levelComplete');
            showTransition("LEVEL 3", "The Gray Area");
            return;

        } else {
            postCard.scene.sound.play('levelComplete');
            triggerGameOver("SHIFT COMPLETE! You saved the truth... or at least the engagement.", true);
            return;
        }
    }

    let currentPost = postData[currentPostIndex];
    authorTextDisplay.setText(currentPost.author);
    bodyTextDisplay.setText(currentPost.text);

    if (currentPost.verified === true) {
        verifiedBadge.setVisible(true);
        verifiedBadge.setX(authorTextDisplay.x + authorTextDisplay.width + 15);
    } else {
        verifiedBadge.setVisible(false);
    }

    let randomNum = Phaser.Math.Between(1, 20);
    avatar.setTexture('avatar' + randomNum);

    if (currentPost.image_file && currentPost.image_file !== "null") {
        postImageDisplay.setTexture(currentPost.image_file);
        postImageDisplay.setDisplaySize(280, 180);
        postImageDisplay.setVisible(true);
        bodyTextDisplay.setY(100);
        bodyTextDisplay.setFontSize('16px');
    } else {
        postImageDisplay.setVisible(false);
        bodyTextDisplay.setY(-90);
        bodyTextDisplay.setFontSize('24px');
    }

    postCard.setPosition(215, 494);
    postCard.angle = 0;
}

function handleSwipe(isApproved) {
    if (isGameOver) return;
    let currentPost = postData[currentPostIndex];
    let scene = postCard.scene;

    scene.sound.play('swipe');

    let oldTruthScore = truthScore;

    let flashColor = isApproved ? 0x22C55E : 0xEF4444;
    postCard.scene.cameras.main.flash(200, (flashColor >> 16) & 255, (flashColor >> 8) & 255, flashColor & 255);

    if (isApproved) {
        truthScore += currentPost.truth_impact;
        engageScore += currentPost.engage_impact;
    } else {
        truthScore -= currentPost.truth_impact;
        engageScore -= currentPost.engage_impact;
    }


    truthScore = Phaser.Math.Clamp(truthScore, 0, 100);
    engageScore = Phaser.Math.Clamp(engageScore, 0, 100);

    if (truthScore > oldTruthScore) {
        scene.sound.play('right');
    } else if (truthScore < oldTruthScore) {
        scene.sound.play('wrong');
    }

    if (truthScore <= 0) {
        triggerGameOver("FIRED: Trust reached 0%. The platform is now a toxic wasteland of misinformation.");
        return;
    }

    if (engageScore <= 0) {
        triggerGameOver("FIRED: Engagement reached 0%. Users got bored, investors pulled out, and the platform died.");
        return;
    }


    postCard.scene.tweens.add({
        targets: truthBar,
        width: (truthScore / 100) * 300,
        duration: 300,
        ease: 'Power2'
    });

    postCard.scene.tweens.add({
        targets: engageBar,
        width: (engageScore / 100) * 300,
        duration: 300,
        ease: 'Power2'
    });

    showFloatingText(215, 494, currentPost.truth_impact, currentPost.engage_impact);

    currentPostIndex++;
    loadNextPost();
}

async function initPlayer() {
    let externalId = localStorage.getItem('echoChamberExternalId');
    let storedName = localStorage.getItem('echoChamberPlayerName');
    
    if (!externalId) {
        externalId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('echoChamberExternalId', externalId);
    }
    
    if (!storedName || storedName === 'Guest') {
        storedName = window.prompt("Enter your operative name for the leaderboard:", "Guest") || "Guest";
        localStorage.setItem('echoChamberPlayerName', storedName);
    }
    
    playerDisplayName = storedName;

    try {
        const response = await fetch(`${API_BASE}/players`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ external_id: externalId, display_name: playerDisplayName })
        });
        const data = await response.json();
        playerId = data.id;
        playerDisplayName = data.display_name || 'Guest';
    } catch (e) {
        console.error('Failed to init player', e);
    }
}

async function submitScore(score, metadata) {
    if (!playerId) return;
    try {
        await fetch(`${API_BASE}/scores/players/${playerId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score, metadata })
        });
    } catch (e) {
        console.error('Failed to submit score', e);
    }
}

async function fetchLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/scores/leaderboard?limit=10`);
        const data = await response.json();
        let lbText = "TOP 10 LEADERBOARD:\n";
        data.forEach((row, i) => {
            lbText += `${i + 1}. ${row.display_name.padEnd(15)} ${row.score}\n`;
        });
        leaderboardText.setText(lbText);
    } catch (e) {
        console.error('Failed to fetch leaderboard', e);
        leaderboardText.setText("Leaderboard unavailable");
    }
}

function triggerGameOver(message, isWin = false) {
    if (isGameOver) return;
    isGameOver = true;
    gameOverTime = postCard.scene.time.now;

    postCard.removeInteractive();
    timerEvent.paused = true;

    if (isWin) {
        gameOverImage.setTexture('winImg');
    } else if (message.indexOf("TIME'S UP") !== -1) {
        gameOverImage.setTexture('shiftOverImg');
    } else {
        gameOverImage.setTexture('systemWarning');
        postCard.scene.sound.play('lose');
    }

    let completedLevels = isWin ? currentLevel : currentLevel - 1;
    let score = (completedLevels * 1000) + (truthScore * 20) + (timeLeft * 10);
    
    finalScoreText.setText(`FINAL SCORE: ${score}\nLevels: ${completedLevels}\nTrust: ${truthScore}%\nTime Bonus: ${timeLeft}s`);

    postCard.setAlpha(0.2);
    gameOverText.setText(message);
    gameOverContainer.setVisible(true);

    gameOverContainer.setScale(0.7);
    gameOverContainer.scene.tweens.add({
        targets: gameOverContainer,
        scale: 1,
        duration: 300,
        ease: 'Back.easeOut'
    });

    // Definitive fix for instant restart: only enable the button after a delay
    postCard.scene.time.delayedCall(1500, () => {
        restartBtnBg.setInteractive();
    });

    submitScore(score, { levels: completedLevels, trust: truthScore, timeRemaining: timeLeft })
        .then(() => fetchLeaderboard());
}

function showTransition(title, subtitle) {
    postCard.setVisible(false);
    postCard.removeInteractive();
    timerEvent.paused = true;

    transitionTitle.setText(title);
    transitionSub.setText(subtitle);

    postCard.scene.tweens.add({
        targets: [transitionTitle, transitionSub],
        alpha: 1,
        duration: 500,
        yoyo: true,
        hold: 1500,
        onComplete: () => {
            postCard.setVisible(true);
            postCard.setInteractive({ draggable: true });
            timerEvent.paused = false;
            loadNextPost();
        }
    });
}

function showFloatingText(x, y, truthAmount, engageAmount) {
    let truthStr = truthAmount >= 0 ? `+${truthAmount} Truth` : `${truthAmount} Truth`;
    let truthColor = truthAmount >= 0 ? '#22C55E' : '#EF4444';
    let tText = postCard.scene.add.text(x - 50, y - 50, truthStr, { fontFamily: 'Inter', fontSize: '24px', fill: truthColor, fontStyle: 'bold' }).setAlpha(1);

    postCard.scene.tweens.add({
        targets: tText, y: y - 100, alpha: 0, duration: 1000, ease: 'Power2',
        onComplete: () => tText.destroy()
    });
}

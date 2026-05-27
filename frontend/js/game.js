let timeLeft = 60;
let timerText;
let timerEvent;

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

// --- Game State Variables ---
let truthScore = 50;
let engageScore = 50;
let currentPostIndex = 0;
let postData = [];

// --- UI Elements ---
let postCard;
let authorTextDisplay;
let timeTextDisplay;
let bodyTextDisplay;
let truthBar;
let engageBar;

function preload() {
    this.load.json('level1', 'data/level_1.json');
}

function create() {
    postData = this.cache.json.get('level1').posts;

    timerText = this.add.text(215, 160, '0:60', { fontFamily: 'Inter', fontSize: '32px', fill: '#111827', fontStyle: 'bold' }).setOrigin(0.5);

    timerEvent = this.time.addEvent({
        delay: 1000,
        callback: () => {
            timeLeft--;
            timerText.setText(`0:${timeLeft < 10 ? '0' : ''}${timeLeft}`);
            if (timeLeft <= 0) {
                timerEvent.remove();
                // Trigger Game Over / Level Complete screen here
                postCard.removeInteractive();
                bodyTextDisplay.setText("TIME'S UP! Shift Over.");
            }
        },
        callbackScope: this,
        loop: true
    });

    // --- 1. Draw UI Text & Background Meters ---
    // Truth Meter (Top)
    this.add.text(20, 45, 'Truth', { fontFamily: 'Inter', fontSize: '14px', fill: '#9CA3AF' });
    this.add.rectangle(20, 65, 300, 20, 0xD1D5DB).setOrigin(0, 0).setAlpha(0.28);
    truthBar = this.add.rectangle(20, 65, 192, 20, 0x22C55E).setOrigin(0, 0);

    // Engagement Meter (Bottom)
    this.add.text(20, 95, 'Engagement', { fontFamily: 'Inter', fontSize: '14px', fill: '#9CA3AF' });
    this.add.rectangle(20, 115, 300, 20, 0xD1D5DB).setOrigin(0, 0).setAlpha(0.28);
    engageBar = this.add.rectangle(20, 115, 192, 20, 0xEF4444).setOrigin(0, 0);

    // --- 2. Generate Rounded Textures (No Figma exports needed!) ---
    let graphics = this.make.graphics();

    // Main White Card
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(0, 0, 382, 456, 32);
    graphics.lineStyle(1, 0x000000, 0.1); // Subtle border
    graphics.strokeRoundedRect(0, 0, 382, 456, 32);
    graphics.generateTexture('cardBg', 382, 456);
    graphics.clear();

    // Inner Gray Text Area
    graphics.fillStyle(0xE5E7EB, 1);
    graphics.fillRoundedRect(0, 0, 325, 319, 32);
    graphics.generateTexture('innerBg', 325, 319);
    graphics.clear();

    // --- 3. Build the Draggable Card Container ---
    let bgImage = this.add.image(0, 0, 'cardBg');
    let innerImage = this.add.image(0, 40, 'innerBg');
    let avatar = this.add.circle(-140, -170, 30, 0xE5E7EB);

    authorTextDisplay = this.add.text(-90, -180, 'Username', {
        fontFamily: 'Inter', fontSize: '20px', fill: '#111827', fontStyle: 'bold'
    });

    timeTextDisplay = this.add.text(100, -175, '2 mins ago', {
        fontFamily: 'Inter', fontSize: '12px', fill: '#9CA3AF'
    });

    bodyTextDisplay = this.add.text(-140, -90, 'Loading...', {
        fontFamily: 'Inter', fontSize: '24px', fill: '#000000',
        wordWrap: { width: 280 }
    });

    // Group everything into one container at the center of the Pro Max screen
    postCard = this.add.container(215, 494, [bgImage, innerImage, avatar, authorTextDisplay, timeTextDisplay, bodyTextDisplay]);
    postCard.setSize(382, 456);
    postCard.setInteractive({ draggable: true });

    loadNextPost();

    // --- 4. Input Logic (Drag & Drop) ---
    this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
        gameObject.x = dragX;
        gameObject.y = 494 + (dragY - 494) * 0.1;
        gameObject.angle = (gameObject.x - 215) * 0.05;
    });

    this.input.on('dragend', function (pointer, gameObject) {
        if (gameObject.x < 120) {
            handleSwipe(false); // Reject
        } else if (gameObject.x > 310) {
            handleSwipe(true);  // Approve
        } else {
            // Snap back
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

    // --- 5. Input Logic (Keyboard) ---
    this.input.keyboard.on('keydown-LEFT', () => { handleSwipe(false); });
    this.input.keyboard.on('keydown-RIGHT', () => { handleSwipe(true); });
}

// --- 6. Core Functions ---
function loadNextPost() {
    if (currentPostIndex >= postData.length) {
        authorTextDisplay.setText("Admin");
        bodyTextDisplay.setText("Shift complete. No more posts to review.");
        timeTextDisplay.setText("Just now");
        postCard.removeInteractive();
        return;
    }

    let currentPost = postData[currentPostIndex];
    authorTextDisplay.setText(currentPost.author);
    bodyTextDisplay.setText(currentPost.text);

    // Reset card visually
    postCard.setPosition(215, 494);
    postCard.angle = 0;
}

function handleSwipe(isApproved) {
    let currentPost = postData[currentPostIndex];

    if (isApproved) {
        truthScore += currentPost.truth_impact;
        engageScore += currentPost.engage_impact;
    } else {
        truthScore -= currentPost.truth_impact;
        engageScore -= currentPost.engage_impact;
    }

    truthScore = Phaser.Math.Clamp(truthScore, 0, 100);
    engageScore = Phaser.Math.Clamp(engageScore, 0, 100);

    // Animate the bars to their new widths (Max width is 300px)
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

    currentPostIndex++;
    loadNextPost();
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
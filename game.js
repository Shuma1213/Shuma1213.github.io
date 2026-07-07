// ====== Firebase 初期化設定 ======
const firebaseConfig = {
    apiKey: "AIzaSyDd2LuXOjqcd30qNM3YZ-5kRxxWFhKvJ_k",
    authDomain: "aribato-134a7.firebaseapp.com",
    databaseURL: "https://aribato-134a7-default-rtdb.firebaseio.com",
    projectId: "aribato-134a7",
    storageBucket: "aribato-134a7.firebasestorage.app",
    messagingSenderId: "573955770812",
    appId: "1:573955770812:web:db120eddd5accc0f2803b9"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const animStyles = document.createElement('style');
animStyles.innerHTML = `
    .card-discard-anim { transform: translateY(50px) scale(0.5) !important; opacity: 0 !important; transition: all 0.5s ease; pointer-events: none;}
    .card-return-anim { transform: translateY(-50px) scale(0.5) !important; opacity: 0 !important; transition: all 0.5s ease; pointer-events: none;}
    .card-debuff-anim { box-shadow: 0 0 15px 5px #9c27b0 !important; transition: all 0.5s ease; }
    
    .fade-out-stone { opacity: 0 !important; transform: scale(0) !important; transition: all 1s ease-in-out !important; }
    .fade-out-stone .stone-standee { opacity: 0 !important; transition: opacity 1s ease-in-out !important; }

    #time-container-bottom { position: absolute; left: 15px; bottom: 175px; } 
    #time-container-top { position: absolute; right: 15px; top: 110px; border-color: #a843ff; box-shadow: 0 0 10px rgba(168,67,255,0.3); flex-direction: column; align-items: center; background: rgba(0,0,0,0.7); padding: 4px 10px; clip-path: polygon(20% 0, 80% 0, 100% 25%, 100% 75%, 80% 100%, 20% 100%, 0 75%, 0 25%); z-index: 5; }
    
    .center-message { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: bold; color: white; z-index: 30000; pointer-events: none; opacity: 0; transition: opacity 0.2s; text-align: center; width: 100%; letter-spacing: 2px; }
    .center-message.show { opacity: 1; }
    .msg-turn { font-size: 36px; font-style: italic; text-shadow: 0 0 15px #00d2ff; }
    .msg-finish { font-style: italic; font-size: 48px; color: #ffeb3b; text-shadow: 0 0 20px #ff9800; }
    .msg-win-yellow { font-size: 48px; color: #ffd700; text-shadow: 0 0 20px #b8860b; }
    .msg-lose-purple { font-size: 48px; color: #a843ff; text-shadow: 0 0 20px #4b0082; filter: grayscale(100%); }

    .stone-standee { 
        position: absolute; 
        bottom: 5%; 
        left: -35%;
        width: 170%; 
        height: 220%; 
        display: flex; 
        flex-direction: column; 
        justify-content: flex-end; 
        align-items: center; 
        opacity: 0; 
        transition: opacity 0.3s ease; 
        z-index: 10; 
        pointer-events: none; 
        filter: drop-shadow(0 8px 6px rgba(0,0,0,0.7));
    }
    #board-container.tilted .stone-standee { 
        opacity: 1; 
        transform: rotateX(-35deg) translateY(-15px) scale(1.1); 
        transform-origin: bottom center;
    }

    .hand-card { 
        border-radius: 50% !important; 
        border: 2px solid #ccc !important; 
        background-color: #222 !important;
        width: 80px !important;
        height: 80px !important;
        overflow: visible !important; 
    }
    .hand-card.card-action { 
        border-radius: 10px !important; 
        clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%) !important; 
        border-color: #a843ff !important;
    }
    
    .card-atk-badge { 
        position: absolute; 
        top: -6px !important; 
        right: -6px !important; 
        left: auto !important; 
        transform: rotate(45deg) !important; 
        width: 28px !important; 
        height: 28px !important; 
        background: linear-gradient(135deg, #00d2ff, #0055ff) !important; 
        border: 1.5px solid #fff !important; 
        z-index: 4 !important; 
        box-shadow: 0 3px 5px rgba(0,0,0,0.7) !important;
    }
    .card-atk-badge.debuffed { background: linear-gradient(135deg, #9c27b0, #4b0082) !important; }
    .card-atk-badge.buffed { background: linear-gradient(135deg, #ff9800, #ff5722) !important; }
    
    .card-atk-text { 
        position: absolute; 
        top: -2px !important; 
        right: -5px !important; 
        left: auto !important; 
        width: 28px;
        text-align: center;
        transform: none !important; 
        font-size: 16px !important; 
        font-weight: 900 !important; 
        color: #fff !important; 
        z-index: 5 !important; 
        text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 0 6px #00d2ff !important; 
    }
    
    .cost-container { 
        position: absolute; 
        top: -5px !important; 
        left: -5px !important; 
        display: flex; 
        flex-direction: column; 
        gap: 0px !important; 
        z-index: 6; 
    }
    .badge-specific, .badge-free {
        border-radius: 50% !important; 
        width: 22px !important; 
        height: 22px !important; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 13px !important; 
        font-weight: 900 !important; 
        border: 2px solid #555 !important; 
        box-shadow: 0 3px 5px rgba(0,0,0,0.7) !important; 
        color: #fff !important;
        text-shadow: 1px 1px 2px #000;
        background-color: #111 !important;
    }
    .badge-specific { z-index: 2; }
    .badge-free { z-index: 1; margin-top: -6px; }

    @keyframes pulse-exam { 0% { box-shadow: 0 0 5px #2ecc71, inset 0 0 5px #2ecc71; border-color: #2ecc71; } 50% { box-shadow: 0 0 15px #2ecc71, inset 0 0 15px #2ecc71; border-color: #fff; } 100% { box-shadow: 0 0 5px #2ecc71, inset 0 0 5px #2ecc71; border-color: #2ecc71; } }
    @keyframes pulse-troupe { 0% { box-shadow: 0 0 5px #8e44ad, inset 0 0 5px #8e44ad; border-color: #8e44ad; } 50% { box-shadow: 0 0 15px #8e44ad, inset 0 0 15px #8e44ad; border-color: #fff; } 100% { box-shadow: 0 0 5px #8e44ad, inset 0 0 5px #8e44ad; border-color: #8e44ad; } }
    @keyframes pulse-mafia { 0% { box-shadow: 0 0 5px #e74c3c, inset 0 0 5px #e74c3c; border-color: #e74c3c; } 50% { box-shadow: 0 0 15px #e74c3c, inset 0 0 15px #e74c3c; border-color: #fff; } 100% { box-shadow: 0 0 5px #e74c3c, inset 0 0 5px #e74c3c; border-color: #e74c3c; } }
    @keyframes pulse-free { 0% { box-shadow: 0 0 5px #ccc, inset 0 0 5px #ccc; border-color: #aaa; } 50% { box-shadow: 0 0 15px #fff, inset 0 0 15px #fff; border-color: #fff; } 100% { box-shadow: 0 0 5px #ccc, inset 0 0 5px #ccc; border-color: #aaa; } }

    .cost-met-287期受験生 { animation: pulse-exam 1.2s infinite !important; background-color: rgba(46, 204, 113, 0.5) !important; color: #2ecc71 !important; }
    .cost-met-幻影旅団 { animation: pulse-troupe 1.2s infinite !important; background-color: rgba(142, 68, 173, 0.5) !important; color: #e0b0ff !important; }
    .cost-met-マフィアンコミュニティー { animation: pulse-mafia 1.2s infinite !important; background-color: rgba(231, 76, 60, 0.5) !important; color: #ffcccc !important; }
    .cost-met-free { animation: pulse-free 1.2s infinite !important; background-color: rgba(255, 255, 255, 0.2) !important; color: #fff !important; }

    .card-name {
        position: absolute;
        bottom: 8px;
        width: 100%;
        text-align: center;
        font-size: 9px !important;
        font-weight: bold;
        color: #fff;
        text-shadow: 1px 1px 1px #000, -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000;
        z-index: 5;
    }
    .card-rank { display: none !important; }

    @media (max-height: 850px) {
        .hand-card { width: 70px !important; height: 70px !important; }
    }
`;
document.head.appendChild(animStyles);

let msgOverlay = document.createElement('div');
msgOverlay.id = 'center-msg-overlay';
msgOverlay.className = 'center-message';
document.body.appendChild(msgOverlay);

async function showCenterMessage(msg, typeClass, duration) {
    msgOverlay.textContent = msg;
    msgOverlay.className = `center-message ${typeClass} show`;
    if (duration > 0) {
        await sleep(duration);
        msgOverlay.classList.remove('show');
    }
}

async function showCopiedCardAnim(card, player) {
    const el = document.createElement('div');
    el.className = `hand-card card-${card.type}`;
    applyCardImage(el, card.id);
    el.style.position = 'fixed';
    el.style.top = '50%';
    el.style.left = '50%';
    el.style.transform = 'translate(-50%, -50%) scale(2)';
    el.style.zIndex = '35000';
    el.style.transition = 'all 1s ease';
    el.innerHTML = `<div class="card-name card-text-node">${card.name}</div>`;
    document.body.appendChild(el);
    
    await sleep(1000); 
    
    const deckTarget = player === myColor ? document.getElementById('gp-btn-bottom') : document.getElementById('gp-btn-top');
    if (deckTarget) {
        const rect = deckTarget.getBoundingClientRect();
        el.style.top = `${rect.top + 20}px`;
        el.style.left = `${rect.left + 40}px`;
        el.style.transform = 'translate(-50%, -50%) scale(0.2)';
        el.style.opacity = '0';
    }
    await sleep(1000);
    el.remove();
}

const timeContainer = document.getElementById('time-container');
if (timeContainer && !document.getElementById('time-container-top')) {
    timeContainer.id = 'time-container-bottom';
    const timeBox = document.getElementById('timer-box');
    if (timeBox) timeBox.id = 'timer-box-bottom';

    const topTime = timeContainer.cloneNode(true);
    topTime.id = 'time-container-top';
    topTime.style.display = 'none';
    
    const topTimeBox = topTime.querySelector('#timer-box-bottom');
    if (topTimeBox) topTimeBox.id = 'timer-box-top';

    timeContainer.parentNode.appendChild(topTime);
}

const boardElement = document.getElementById('board');
const boardContainer = document.getElementById('board-container');
const svgGroup = document.getElementById('combo-lines-group');
const logDisplay = document.getElementById('log-display');
const boardSize = 6;

let currentRoomId = null;
let isHost = false;
let myDeckChoice = "";
let isOnlineMode = false;
let isGameOver = false;
let currentMatchId = 0; 
let consecutivePasses = 0; 

let myColor, opColor, currentPlayer;
let boardData = new Array(36).fill(null);
let hpYellow = 120; let hpPurple = 120;
let timeLeft = 30; let timerId = null;
let actionUsedThisTurn = false;
let usedThinkThisTurn = false;

window.isBoardSelecting = false; 
window.isHandSelecting = false;
window.autoSelectAndResolve = null;
window.isBoardTargeting = false;
window.autoResolveBoardTarget = null;

let playerGP = { yellow: { gp: {} }, purple: { gp: {} } };
let discardYellow = []; let discardPurple = [];
let handYellow = [null, null, null, null]; 
let handPurple = [null, null, null, null];
let masterDecks = {};
let activeEffects = []; 

let timeExtendCountMy = 3; 
window.opTimeExtend = 3; 

let lastDamageAnimTs = 0;
let lastDamageRedTs = 0;
let lastGpFlyTs = 0;

const selfDamageIds = ["0091", "0103", "0104", "0105", "0112", "0117", "0164"];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function applyCardImage(element, cardId) {
    if (!cardId) return;
    const id = String(cardId).trim();
    const path1 = `cards/${id}.png`;
    const path2 = `cards/${id}.PNG`;
    
    const img = new Image();
    img.onload = () => {
        element.style.backgroundImage = `url('${path1}')`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
    };
    img.onerror = () => {
        const img2 = new Image();
        img2.onload = () => {
            element.style.backgroundImage = `url('${path2}')`;
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center';
        };
        img2.src = path2;
    };
    img.src = path1;
}

function applyStandeeImage(element, cardId) {
    if (!cardId) return;
    const id = String(cardId).trim();
    const path1 = `character/c${id}.png`;
    const path2 = `character/c${id}.PNG`;
    
    const img = new Image();
    img.onload = () => {
        element.style.backgroundImage = `url('${path1}')`;
        element.style.backgroundSize = 'contain';
        element.style.backgroundRepeat = 'no-repeat';
        element.style.backgroundPosition = 'bottom center';
    };
    img.onerror = () => {
        const img2 = new Image();
        img2.onload = () => {
            element.style.backgroundImage = `url('${path2}')`;
            element.style.backgroundSize = 'contain';
            element.style.backgroundRepeat = 'no-repeat';
            element.style.backgroundPosition = 'bottom center';
        };
        img2.src = path2;
    };
    img.src = path1;
}

function resetGameState() {
    currentMatchId++; 
    if (currentRoomId) {
        db.ref('rooms/' + currentRoomId).off();
        currentRoomId = null;
    }
    
    isGameOver = false;
    consecutivePasses = 0;
    boardData = new Array(36).fill(null);
    hpYellow = 120; hpPurple = 120;
    timeLeft = 30;
    if (timerId) clearInterval(timerId);
    timerId = null;
    actionUsedThisTurn = false; usedThinkThisTurn = false;
    window.isBoardSelecting = false; window.isHandSelecting = false;
    window.autoSelectAndResolve = null; window.isBoardTargeting = false; window.autoResolveBoardTarget = null;
    playerGP = { yellow: { gp: {} }, purple: { gp: {} } };
    discardYellow = []; discardPurple = [];
    handYellow = [null, null, null, null]; handPurple = [null, null, null, null];
    masterDecks = {}; activeEffects = []; 
    timeExtendCountMy = 3; window.opTimeExtend = 3;
    
    msgOverlay.classList.remove('show');
    document.querySelectorAll('.damage-popup').forEach(e => e.remove());
    document.querySelectorAll('.gp-fly-particle').forEach(e => e.remove());
    document.querySelectorAll('.stone').forEach(e => e.classList.remove('fade-out-stone'));
    document.querySelectorAll('.stone-standee').forEach(e => e.classList.remove('fade-out-stone'));
    boardElement.innerHTML = '';
    if (svgGroup) svgGroup.innerHTML = '';
    document.getElementById('hand-top').innerHTML = '';
    document.getElementById('hand-bottom').innerHTML = '';
    updateHPUI();
}

function getCardById(idStr) {
    const card = CARD_DATABASE.find(c => c.id === idStr);
    return card ? JSON.parse(JSON.stringify({ ...card, original_atk: card.atk })) : null;
}

// デッキの内訳を更新
function buildFixedDeck(deckType) {
    let deck = [];
    let ids = deckType === '287期受験生' ? 
        ["A043","A043","A044","A039","A040","A040","0002","0002","0010","0010","0004","0004","0156","0156","0003","0003","0012","0012","0031","0031","0017","0017","0023","0023","0032","0032","0036","0036","0016","0016"] :
        ["A054","A054","A087","A087","A082","A082","0046","0046","0048","0048","0162","0162","0073","0073","0068","0068","0066","0066","0161","0161","0081","0081","0070","0070","0075","0075","0055","0055","0065","0065"];
    ids.forEach(id => { const c = getCardById(id); if(c) deck.push(c); });
    shuffleDeck(deck); return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) { 
        const j = Math.floor(Math.random() * (i + 1)); 
        [deck[i], deck[j]] = [deck[j], deck[i]]; 
    }
}

window.selectMode = function(mode) {
    isOnlineMode = (mode === 'online');
    document.getElementById('mode-select-overlay').style.display = 'none';
    document.getElementById('deck-select-overlay').style.display = 'flex';
};

window.selectDeck = function(deckName) {
    myDeckChoice = deckName;
    document.getElementById('deck-select-overlay').style.display = 'none';
    
    if (isOnlineMode) {
        document.getElementById('selected-deck-name').textContent = deckName;
        document.getElementById('room-select-overlay').style.display = 'flex';
    } else {
        startOfflineGame(deckName);
    }
};

window.createRoom = function() {
    resetGameState();
    document.getElementById('room-select-overlay').style.display = 'none';
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    currentRoomId = roomId;
    isHost = true;
    myColor = 'yellow'; 
    opColor = 'purple';

    const roomRef = db.ref('rooms/' + roomId);
    roomRef.set({
        status: 'waiting',
        player1Deck: myDeckChoice,
        currentPlayer: 'yellow'
    });

    document.getElementById('display-room-id').textContent = roomId;
    document.getElementById('waiting-overlay').style.display = 'flex';

    roomRef.on('value', (snap) => {
        const data = snap.val();
        if (data && data.status === 'playing') {
            roomRef.off('value'); 
            document.getElementById('waiting-overlay').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            document.getElementById('app-container').appendChild(msgOverlay);
            logDisplay.textContent = "対戦相手が入室しました！";
            
            masterDecks = {
                yellow: buildFixedDeck(myDeckChoice),
                purple: buildFixedDeck(data.player2Deck)
            };
            initOnlineGame();
        }
    });
};

window.joinRoom = function() {
    resetGameState();
    const roomId = document.getElementById('room-id-input').value.trim();
    if (!roomId) { alert("ルームIDを入力してください"); return; }

    const roomRef = db.ref('rooms/' + roomId);
    roomRef.once('value', (snap) => {
        const data = snap.val();
        if (data && data.status === 'waiting') {
            document.getElementById('room-select-overlay').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            document.getElementById('app-container').appendChild(msgOverlay);
            
            currentRoomId = roomId;
            isHost = false;
            myColor = 'purple'; 
            opColor = 'yellow';
            
            roomRef.update({
                status: 'playing',
                player2Deck: myDeckChoice
            });

            masterDecks = {
                yellow: buildFixedDeck(data.player1Deck),
                purple: buildFixedDeck(myDeckChoice)
            };
            logDisplay.textContent = "部屋に入室しました！";
            initOnlineGame();
        } else {
            alert("部屋が見つからないか、既に対戦中です。正しいIDか確認してください。");
        }
    });
};

function pushGameStateToFirebase(nextPlayer = null) {
    if (!isOnlineMode || isGameOver || !currentRoomId) return;
    const syncData = {
        hpYellow: hpYellow,
        hpPurple: hpPurple,
        playerGPJSON: JSON.stringify(playerGP),
        timeExtendCountYellow: myColor === 'yellow' ? timeExtendCountMy : window.opTimeExtend,
        timeExtendCountPurple: myColor === 'purple' ? timeExtendCountMy : window.opTimeExtend,
        boardDataJSON: JSON.stringify(boardData),
        handYellowJSON: JSON.stringify(handYellow),
        handPurpleJSON: JSON.stringify(handPurple),
        discardYellowJSON: JSON.stringify(discardYellow),
        discardPurpleJSON: JSON.stringify(discardPurple),
        activeEffectsJSON: JSON.stringify(activeEffects) 
    };
    if (nextPlayer) syncData.currentPlayer = nextPlayer;
    db.ref('rooms/' + currentRoomId).update(syncData);
}

function initOnlineGame() {
    const botBadge = document.getElementById('turn-badge-bottom');
    const topBadge = document.getElementById('turn-badge-top');
    botBadge.textContent = isHost ? '先攻' : '後攻';
    topBadge.textContent = isHost ? '後攻' : '先攻';
    botBadge.className = 'turn-badge ' + (isHost ? 'badge-yellow' : 'badge-purple');
    topBadge.className = 'turn-badge ' + (isHost ? 'badge-purple' : 'badge-yellow');
    
    playerGP[opColor].gp['フリー'] = 1; 
    currentPlayer = 'yellow';
    
    boardData[15] = { color: 'yellow', type: 'stone', name: '' };
    boardData[20] = { color: 'yellow', type: 'stone', name: '' };
    boardData[14] = { color: 'purple', type: 'stone', name: '' };
    boardData[21] = { color: 'purple', type: 'stone', name: '' };

    const roomRef = db.ref('rooms/' + currentRoomId);
    
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data || data.status === 'waiting' || isGameOver) return;

        if (data.boardDataJSON) boardData = JSON.parse(data.boardDataJSON);
        if (data.handYellowJSON) handYellow = JSON.parse(data.handYellowJSON);
        if (data.handPurpleJSON) handPurple = JSON.parse(data.handPurpleJSON);
        if (data.discardYellowJSON) discardYellow = JSON.parse(data.discardYellowJSON);
        if (data.discardPurpleJSON) discardPurple = JSON.parse(data.discardPurpleJSON);
        if (data.playerGPJSON) playerGP = JSON.parse(data.playerGPJSON);
        if (data.activeEffectsJSON) activeEffects = JSON.parse(data.activeEffectsJSON);

        if (data.hpYellow !== undefined) hpYellow = data.hpYellow;
        if (data.hpPurple !== undefined) hpPurple = data.hpPurple;
        
        const myCount = myColor === 'yellow' ? data.timeExtendCountYellow : data.timeExtendCountPurple;
        const opCount = opColor === 'yellow' ? data.timeExtendCountYellow : data.timeExtendCountPurple;
        if (myCount !== undefined) timeExtendCountMy = myCount;
        
        if (opCount !== undefined) {
            if (opCount < window.opTimeExtend && currentPlayer !== myColor) {
                timeLeft += 30;
                const timeBoxTop = document.getElementById('timer-box-top');
                if (timeBoxTop) timeBoxTop.textContent = timeLeft;
            }
            window.opTimeExtend = opCount;
        }

        updateHPUI();
        renderBoard();
        renderHands();

        if (data.damageAnim && data.damageAnim.ts !== lastDamageAnimTs) {
            lastDamageAnimTs = data.damageAnim.ts;
            if (currentPlayer !== myColor) showDamageAnimation(data.damageAnim.damageText, data.damageAnim.targetPlayer, data.damageAnim.colorClass, false);
        }
        if (data.damageRedAnim && data.damageRedAnim.ts !== lastDamageRedTs) {
            lastDamageRedTs = data.damageRedAnim.ts;
            if (currentPlayer !== myColor) showDamageAnimationReduction(data.damageRedAnim.reduction, data.damageRedAnim.finalDmg, data.damageRedAnim.targetPlayer, false);
        }
        if (data.gpFlyAnim && data.gpFlyAnim.ts !== lastGpFlyTs) {
            lastGpFlyTs = data.gpFlyAnim.ts;
            if (currentPlayer !== myColor) animateGPFly(data.gpFlyAnim.startIndex, data.gpFlyAnim.playerColor, data.gpFlyAnim.group, false);
        }
        
        if ((hpYellow <= 0 || hpPurple <= 0) && !isGameOver) {
            handleGameOver();
            return;
        }
        
        for (let i = 1; i <= 3; i++) {
            const myDiamond = document.getElementById(`td-bottom-${i}`);
            if (myDiamond) {
                if (i > timeExtendCountMy) myDiamond.classList.add('used');
                else myDiamond.classList.remove('used');
            }
            const opDiamond = document.getElementById(`td-top-${i}`);
            if (opDiamond) {
                if (i > window.opTimeExtend) opDiamond.classList.add('used');
                else opDiamond.classList.remove('used');
            }
        }
        
        if (data.currentPlayer && data.currentPlayer !== currentPlayer) {
            currentPlayer = data.currentPlayer;
            startTurn(); 
        }
    });

    startMulliganPhase(); 
}

window.startOfflineGame = function(selectedDeck) {
    resetGameState();
    document.getElementById('app-container').style.display = 'flex';
    document.getElementById('app-container').appendChild(msgOverlay);
    
    const isYouFirst = Math.random() < 0.5;
    myColor = isYouFirst ? 'yellow' : 'purple';
    opColor = isYouFirst ? 'purple' : 'yellow';

    const botBadge = document.getElementById('turn-badge-bottom');
    const topBadge = document.getElementById('turn-badge-top');
    botBadge.textContent = isYouFirst ? '先攻' : '後攻';
    topBadge.textContent = isYouFirst ? '後攻' : '先攻';
    botBadge.className = 'turn-badge ' + (isYouFirst ? 'badge-yellow' : 'badge-purple');
    topBadge.className = 'turn-badge ' + (isYouFirst ? 'badge-purple' : 'badge-yellow');

    const oppDeckChoices = ['287期受験生', '幻影旅団'];
    const oppDeck = oppDeckChoices[Math.floor(Math.random() * oppDeckChoices.length)];

    masterDecks = {
        yellow: myColor === 'yellow' ? buildFixedDeck(selectedDeck) : buildFixedDeck(oppDeck),
        purple: myColor === 'purple' ? buildFixedDeck(selectedDeck) : buildFixedDeck(oppDeck)
    };
    
    playerGP[isYouFirst ? opColor : myColor].gp['フリー'] = 1;
    currentPlayer = 'yellow';
    
    boardData[15] = { color: 'yellow', type: 'stone', name: '' };
    boardData[20] = { color: 'yellow', type: 'stone', name: '' };
    boardData[14] = { color: 'purple', type: 'stone', name: '' };
    boardData[21] = { color: 'purple', type: 'stone', name: '' };

    startMulliganPhase();
}

function ensureCharacterInHand(player) {
    const hand = player === 'yellow' ? handYellow : handPurple;
    const deck = player === 'yellow' ? masterDecks.yellow : masterDecks.purple;
    
    let nonNulls = hand.filter(c => c !== null);
    while (nonNulls.length > 0 && nonNulls.every(c => c.type === 'action') && deck.some(c => c.type === 'character')) {
        deck.push(...nonNulls);
        for(let i=0; i<4; i++) hand[i] = null;
        shuffleDeck(deck);
        let drawCount = 0;
        for (let i = 0; i < 4; i++) {
            if (deck.length > 0) hand[i] = deck.pop();
        }
        nonNulls = hand.filter(c => c !== null);
    }
}

function drawCards(player, count = 4) {
    const hand = player === 'yellow' ? handYellow : handPurple;
    const deck = player === 'yellow' ? masterDecks.yellow : masterDecks.purple;
    
    let drawCount = 0;
    for (let i = 0; i < 4; i++) {
        if (hand[i] === null && deck.length > 0 && drawCount < count) {
            hand[i] = deck.pop();
            drawCount++;
        }
    }
    ensureCharacterInHand(player); 
}

function updateHPUI() {
    hpYellow = Math.max(0, hpYellow);
    hpPurple = Math.max(0, hpPurple);
    
    const topVal = opColor === 'yellow' ? hpYellow : hpPurple;
    const botVal = myColor === 'yellow' ? hpYellow : hpPurple;
    document.getElementById('hp-top-val').textContent = topVal;
    document.getElementById('hp-bottom-val').textContent = botVal;
    document.getElementById('hp-top-fill').style.width = `${(topVal/120)*100}%`;
    document.getElementById('hp-bottom-fill').style.width = `${(botVal/120)*100}%`;
}

const directions = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

function checkCostStatus(card, playerColor) {
    if (!card) return 'SHORTAGE';
    const pGP = playerGP[playerColor].gp;
    const availSpec = pGP[card.group] || 0;
    const totalGP = Object.values(pGP).reduce((sum, val) => sum + val, 0);
    const specificCost = card.cost?.specific || 0;
    const freeCost = card.cost?.free || 0;
    if (availSpec >= specificCost && totalGP >= (specificCost + freeCost)) return 'OK';
    return 'SHORTAGE';
}

function checkAbilityMet(card, index, flippable, playerColor) {
    if (card.stolen) return false; 
    if (!card.ability || !card.ability.text) return true;
    const text = card.ability.text;
    let met = true;
    
    const matchAtk = text.match(/通常ダメージが(\d+)以上/);
    if (matchAtk) {
        const req = parseInt(matchAtk[1]);
        let normalDamage = card.atk + (flippable.length >= 2 ? flippable.length * 2 - 3 : 0);
        if (normalDamage < req) met = false;
    }
    const matchFlip = text.match(/(\d+)枚以上ひっくり返した/);
    if (matchFlip) {
        if (flippable.length < parseInt(matchFlip[1])) met = false;
    }
    if (text.includes("周囲8マスに相手の")) {
        let found = false;
        const cx = index % 6; const cy = Math.floor(index / 6);
        for (const [dx, dy] of directions) {
            let nx = cx + dx, ny = cy + dy;
            if (nx>=0 && nx<6 && ny>=0 && ny<6) {
                let tIdx = ny * 6 + nx;
                let tCard = boardData[tIdx];
                if (tCard && tCard.type === 'character' && tCard.color !== playerColor) found = true;
            }
        }
        if (!found) met = false;
    }
    const matchOther = text.match(/盤面に自分の.*?他に(\d+)枚以上/);
    if (matchOther) {
        const req = parseInt(matchOther[1]);
        const count = boardData.filter(c => c && c.type === 'character' && c.color === playerColor).length;
        if (count < req) met = false; 
    }
    const matchHisoka = text.match(/盤面に自分の「ゴン」が1体以上/);
    if (matchHisoka) {
        const found = boardData.some(c => c && c.type === 'character' && c.color === playerColor && c.name === 'ゴン');
        if (!found) met = false;
    }
    const matchHp = text.match(/HPが(\d+)以下/);
    if (matchHp) {
        const req = parseInt(matchHp[1]);
        const myHp = playerColor === 'yellow' ? hpYellow : hpPurple;
        if (myHp > req) met = false;
    }
    return met;
}

// ====== 対象選択UI ======
async function selectHandCardsTarget(actingPlayer, targetPlayer, count, message, filterType = 'all') {
    const rawHand = targetPlayer === 'yellow' ? handYellow : handPurple;
    const nonNullCards = rawHand.filter(c => c !== null);

    let selectableCards = nonNullCards;
    if (filterType === 'character' || filterType === 'debuff' || filterType === 'seal_0140') {
        selectableCards = nonNullCards.filter(c => c.type === 'character');
    } else if (filterType === 'steal_a054') {
        selectableCards = nonNullCards.filter(c => c.type === 'character' && (c.cost.specific + c.cost.free) <= 5);
    } else if (filterType === 'discard_0100') {
        selectableCards = nonNullCards.filter(c => c && (c.cost.specific + c.cost.free) === 4);
    }

    if (actingPlayer === myColor) {
        if (selectableCards.length === 0) {
            logDisplay.textContent = '効果対象なし';
            await sleep(1000);
            return [];
        }
        if (selectableCards.length <= count) {
            if (targetPlayer === actingPlayer) {
                logDisplay.textContent = `自動選択: ${selectableCards.map(c=>c.name).join(', ')}`;
            } else {
                logDisplay.textContent = `自動選択を行いました`;
            }
            await sleep(1000);
            return selectableCards;
        }
    } else {
        if (selectableCards.length === 0) return [];
        return selectableCards.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    window.isHandSelecting = true;

    return new Promise(resolve => {
        const overlay = document.getElementById('hand-select-overlay');
        const title = document.getElementById('hand-select-title');
        const grid = document.getElementById('hand-select-grid');
        const okBtn = document.getElementById('hand-select-ok-btn');

        title.textContent = message;
        grid.innerHTML = '';
        let selectedCards = [];

        window.autoSelectAndResolve = () => {
            let autoSelected = selectableCards.sort(() => 0.5 - Math.random()).slice(0, count);
            closeHandSelection(overlay, resolve, autoSelected);
        };

        nonNullCards.forEach(card => {
            const isSelectable = selectableCards.includes(card);
            const el = document.createElement('div');
            
            if (targetPlayer === myColor || filterType === 'debuff' || filterType === 'steal_a054' || filterType === 'seal_0140' || filterType === 'discard_0100') {
                el.className = `hand-card card-${card.type}`;
                applyCardImage(el, card.id); 
                
                let badgeClass = 'card-atk-badge';
                if (card.original_atk !== undefined) {
                    if (card.atk > card.original_atk) badgeClass += ' buffed';
                    if (card.atk < card.original_atk) badgeClass += ' debuffed';
                }
                
                let displaySpec = card.cost.specific;
                let displayFree = card.cost.free;
                const pGP = playerGP[targetPlayer].gp;
                const availSpec = pGP[card.group] || 0;
                const totalGP = Object.values(pGP).reduce((sum, val) => sum + val, 0);

                let specPaid = Math.min(displaySpec, availSpec);
                displaySpec -= specPaid;
                
                let remainingTotalGP = totalGP - specPaid;
                let freePaid = Math.min(displayFree, remainingTotalGP);
                displayFree -= freePaid;

                let costHtml = `<div class="cost-container">`;
                let specGlowClass = displaySpec === 0 && card.cost.specific > 0 ? ` cost-met-${card.group}` : '';
                let freeGlowClass = displayFree === 0 && card.cost.free > 0 ? ` cost-met-free` : '';

                if (card.cost.specific > 0) costHtml += `<div class="badge-specific${specGlowClass}">${displaySpec}</div>`;
                if (card.cost.free > 0) costHtml += `<div class="badge-free${freeGlowClass}">${displayFree}</div>`;
                costHtml += `</div>`;

                el.innerHTML = `<div class="${badgeClass}"></div><div class="card-atk-text card-text-node">${card.type==='action'?'A':card.atk}</div><div class="card-rank card-text-node">${card.rank}</div><div class="card-name card-text-node">${card.name}</div>${costHtml}`;
            } else {
                el.className = card.type === 'character' ? 'hidden-char' : 'hidden-action';
            }

            if (!isSelectable) {
                el.style.opacity = '0.4';
                el.style.cursor = 'not-allowed';
                el.style.filter = 'grayscale(80%)';
            } else {
                el.style.cursor = 'pointer';
                el.onclick = () => {
                    const idx = selectedCards.indexOf(card);
                    if (idx > -1) {
                        selectedCards.splice(idx, 1);
                        el.style.border = "";
                        el.style.boxShadow = "";
                    } else {
                        if (count === 1) { 
                            selectedCards = [card];
                            Array.from(grid.children).forEach(child => { child.style.border = ""; child.style.boxShadow = ""; });
                            el.style.border = "3px solid #00d2ff";
                            el.style.boxShadow = "0 0 15px #00d2ff";
                        } else if (selectedCards.length < count) {
                            selectedCards.push(card);
                            el.style.border = "3px solid #00d2ff";
                            el.style.boxShadow = "0 0 15px #00d2ff";
                        }
                    }
                    okBtn.style.opacity = selectedCards.length === count ? '1' : '0.5';
                };
            }
            grid.appendChild(el);
        });

        overlay.style.display = 'flex';
        okBtn.style.display = 'block';
        okBtn.style.opacity = selectedCards.length === count ? '1' : '0.5';

        okBtn.onclick = () => {
            if (selectedCards.length < count) return;
            closeHandSelection(overlay, resolve, selectedCards);
        };
    });
}

function closeHandSelection(overlay, resolve, selectedCards) {
    overlay.style.display = 'none';
    window.isHandSelecting = false;
    window.autoSelectAndResolve = null;
    resolve(selectedCards);
}

async function selectBoardTarget(validIndices) {
    window.isBoardTargeting = true;
    
    validIndices.forEach(idx => {
        const cell = boardElement.children[idx];
        const hl = document.createElement('div');
        hl.className = 'highlight-box target-hl';
        hl.style.borderColor = '#ffd700';
        hl.style.boxShadow = 'inset 0 0 15px #ffd700, 0 0 15px #ffd700';
        hl.style.zIndex = '20000';
        hl.style.cursor = 'crosshair';
        hl.style.pointerEvents = 'auto'; 
        cell.appendChild(hl);
    });

    return new Promise(resolve => {
        const clickHandler = (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            const idx = Array.from(boardElement.children).indexOf(cell);
            if (validIndices.includes(idx)) {
                cleanup(idx);
            }
        };
        
        const cleanup = (resultIdx) => {
            boardElement.removeEventListener('click', clickHandler);
            document.querySelectorAll('.target-hl').forEach(el => el.remove());
            window.isBoardTargeting = false;
            window.autoResolveBoardTarget = null;
            resolve(resultIdx);
        };

        window.autoResolveBoardTarget = () => {
            const randomIdx = validIndices[Math.floor(Math.random() * validIndices.length)];
            cleanup(randomIdx);
        };

        boardElement.addEventListener('click', clickHandler);
    });
}

function createCardElementUI(card, index, playerColor, isHandCard = true) {
    if (!card) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'hand-card empty-slot';
        emptyEl.style.background = 'rgba(0,0,0,0.1)';
        emptyEl.style.border = '1px dashed #555';
        emptyEl.style.pointerEvents = 'none';
        return emptyEl;
    }
    const el = document.createElement('div'); let className = `hand-card card-${card.type}`;
    const costStatus = checkCostStatus(card, playerColor);
    
    if (isHandCard) {
        if (currentPlayer !== playerColor) {
            className += ' inactive'; el.style.pointerEvents = 'none';
        }
        else if (costStatus !== 'OK') { className += card.type === 'character' ? ' cost-shortage' : ' unplayable'; }
        if (currentPlayer === playerColor && card.type === 'action' && actionUsedThisTurn) className += ' unplayable';
    }
    
    let atkBadgeClass = 'card-atk-badge';
    let displayAtk = card.atk;
    if (card.type === 'character' && card.original_atk !== undefined) {
        if (card.atk > card.original_atk) atkBadgeClass += ' buffed';
        else if (card.atk < card.original_atk) atkBadgeClass += ' debuffed';
    }

    let displaySpec = card.cost.specific;
    let displayFree = card.cost.free;
    
    if (isHandCard) {
        const pGP = playerGP[playerColor].gp;
        const group = card.group;
        const availSpec = pGP[group] || 0;
        const totalGP = Object.values(pGP).reduce((sum, val) => sum + val, 0);

        let specPaid = Math.min(displaySpec, availSpec);
        displaySpec -= specPaid;
        
        let remainingTotalGP = totalGP - specPaid;
        let freePaid = Math.min(displayFree, remainingTotalGP);
        displayFree -= freePaid;
    }

    el.className = className; 
    applyCardImage(el, card.id);
    
    let costHtml = `<div class="cost-container">`;
    let specGlowClass = displaySpec === 0 && card.cost.specific > 0 ? ` cost-met-${card.group}` : '';
    let freeGlowClass = displayFree === 0 && card.cost.free > 0 ? ` cost-met-free` : '';

    if (card.cost.specific > 0) costHtml += `<div class="badge-specific${specGlowClass}">${displaySpec}</div>`;
    if (card.cost.free > 0) costHtml += `<div class="badge-free${freeGlowClass}">${displayFree}</div>`;
    costHtml += `</div>`;

    el.innerHTML = `<div class="${atkBadgeClass}"></div><div class="card-atk-text card-text-node">${card.type==='action'?'A':displayAtk}</div><div class="card-rank card-text-node">${card.rank}</div><div class="card-name card-text-node">${card.name}</div>${costHtml}`;
    return el;
}

 updateHighlightsAndLines() {
    document.querySelectorAll('.highlight-box:not(.target-hl)').forEach(el => el.remove());
    if (svgGroup) svgGroup.innerHTML = '';
    
    if (window.selectedHandIndex == null || currentPlayer !== myColor) return;
    
    const hand = myColor === 'yellow' ? handYellow : handPurple;
    const card = hand[window.selectedHandIndex];
    if (!card || card.type !== 'character') return;

    const costStatus = checkCostStatus(card, myColor);

    for (let i = 0; i < 36; i++) {
        if (boardData[i] !== null) continue;
        const { flippable, triggers } = getFlippableAndTriggers(i, myColor);
        if (flippable.length === 0) continue;

        const cell = boardElement.children[i];
        const hl = document.createElement('div');
        hl.className = 'highlight-box';

        if (costStatus === 'SHORTAGE') {
            hl.classList.add('hl-gray'); 
        } else {
            const abilityMet = checkAbilityMet(card, i, flippable, myColor);
            if (abilityMet) hl.classList.add('hl-yellow'); 
            else hl.classList.add('hl-blue'); 

            if (triggers.length > 0 && svgGroup) {
                const cx = (i % 6) * 52 + 26;
                const cy = Math.floor(i / 6) * 52 + 26;
                triggers.forEach(tIdx => {
                    const targetCard = boardData[tIdx];
                    if (targetCard && targetCard.type === 'character' && targetCard.combo && targetCard.combo.text) {
                        const tx = (tIdx % 6) * 52 + 26;
                        const ty = Math.floor(tIdx / 6) * 52 + 26;
                        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                        line.setAttribute("x1", cx);
                        line.setAttribute("y1", cy);
                        line.setAttribute("x2", tx);
                        line.setAttribute("y2", ty);
                        line.setAttribute("stroke", "#ffd700");
                        line.setAttribute("stroke-width", "3");
                        line.setAttribute("stroke-dasharray", "8, 4");
                        line.setAttribute("filter", "url(#glow)");
                        svgGroup.appendChild(line);
                    }
                });
            }
        }
        cell.appendChild(hl);
    }
}

function renderHands() {
    const topArea = document.getElementById('hand-top'); const bottomArea = document.getElementById('hand-bottom');
    topArea.innerHTML = ''; bottomArea.innerHTML = '';
    
    (myColor === 'yellow' ? handYellow : handPurple).forEach((card, i) => {
        if (card === null) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'hand-card empty-slot';
            bottomArea.appendChild(emptyEl);
            return;
        }
        const el = createCardElementUI(card, i, myColor);
        if (card.type === 'action' && currentPlayer === myColor && !actionUsedThisTurn) el.onclick = () => playActionCard(i);
        else if (card.type === 'character') {
            el.onclick = () => { 
                if (currentPlayer === myColor && !window.isBoardSelecting && !window.isBoardTargeting) { 
                    window.selectedHandIndex = (window.selectedHandIndex === i) ? null : i; 
                    updateBoardPerspective(); 
                    renderHands(); 
                    updateHighlightsAndLines();
                } 
            };
        }
        if (window.selectedHandIndex === i && card.type === 'character') el.classList.add('selected');
        bottomArea.appendChild(el);
    });
    
    (opColor === 'yellow' ? handYellow : handPurple).forEach((card, i) => {
        if (card === null) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'hidden-char empty-slot';
            topArea.appendChild(emptyEl);
            return;
        }
        const el = document.createElement('div');
        el.className = card.type === 'character' ? 'hidden-char' : 'hidden-action';
        el.style.position = 'relative'; 
        
        if (card.type === 'character' && card.original_atk !== undefined) {
            let badge = document.createElement('div');
            badge.className = 'card-atk-badge opponent-badge';
            if (card.atk > card.original_atk) badge.classList.add('buffed');
            else if (card.atk < card.original_atk) badge.classList.add('debuffed');
            el.appendChild(badge);
        }
        topArea.appendChild(el);
    });
}

function updateBoardPerspective() {
    if (currentPlayer === myColor && !window.isBoardSelecting) {
        boardContainer.classList.remove('tilted');
    } else {
        boardContainer.classList.add('tilted'); 
    }
}

// ====== マリガン画面処理 ======
async function startMulliganPhase() {
    const matchId = currentMatchId;
    drawCards('yellow', 4); drawCards('purple', 4); updateHPUI();
    const overlay = document.getElementById('mulligan-overlay');
    const mulNodes = [ document.getElementById('mul-top'), document.getElementById('mul-left'), document.getElementById('mul-right'), document.getElementById('mul-bottom') ];
    let selectedForMulligan = [false, false, false, false];
    const myHand = myColor === 'yellow' ? handYellow : handPurple;
    
    let mulliganTimeLeft = 15;
    let mulTimerBox = document.getElementById('mulligan-timer');
    if (!mulTimerBox) {
        mulTimerBox = document.createElement('div');
        mulTimerBox.id = 'mulligan-timer';
        mulTimerBox.style.cssText = 'font-size: 24px; color: #ffeb3b; font-weight: bold; margin-bottom: 10px;';
        const title = document.getElementById('mulligan-title');
        title.parentNode.insertBefore(mulTimerBox, title.nextSibling);
    }
    mulTimerBox.textContent = `残り時間: ${mulliganTimeLeft}秒`;

    myHand.forEach((card, i) => {
        const el = createCardElementUI(card, i, myColor, false);
        el.onclick = () => { selectedForMulligan[i] = !selectedForMulligan[i]; el.classList.toggle('mulligan-selected'); };
        mulNodes[i].innerHTML = ''; mulNodes[i].appendChild(el);
    });
    overlay.style.display = 'flex';
    
    const finalizeMulligan = () => {
        if (matchId !== currentMatchId) return;
        overlay.style.display = 'none';
        let returnedMy = [];
        for(let i=3; i>=0; i--) {
            if(selectedForMulligan[i]) {
                returnedMy.push(myHand[i]);
                myHand[i] = null;
            }
        }
        const myDeck = myColor === 'yellow' ? masterDecks.yellow : masterDecks.purple;
        myDeck.push(...returnedMy); 
        shuffleDeck(myDeck);
        drawCards(myColor, 4);
        
        if (isOnlineMode) {
            const updates = {};
            if (myColor === 'yellow') updates.handYellowJSON = JSON.stringify(handYellow);
            else updates.handPurpleJSON = JSON.stringify(handPurple);
            db.ref('rooms/' + currentRoomId).update(updates);

            if (currentPlayer === myColor) startTurn();
            else renderHands();
        } else {
            startTurn();
        }
    };

    let mulInterval = setInterval(() => {
        if (matchId !== currentMatchId) { clearInterval(mulInterval); return; }
        mulliganTimeLeft--;
        mulTimerBox.textContent = `残り時間: ${mulliganTimeLeft}秒`;
        if (mulliganTimeLeft <= 0) {
            clearInterval(mulInterval);
            selectedForMulligan = [false, false, false, false];
            finalizeMulligan();
        }
    }, 1000);

    document.getElementById('mulligan-ok-btn').onclick = () => {
        clearInterval(mulInterval);
        finalizeMulligan();
    };
}

async function animateHandCard(card, playerColor, animClass) {
    const hand = playerColor === 'yellow' ? handYellow : handPurple;
    const idx = hand.indexOf(card);
    if (idx > -1) {
        const containerId = playerColor === myColor ? 'hand-bottom' : 'hand-top';
        const el = document.getElementById(containerId).children[idx];
        if (el) el.classList.add(animClass);
    }
    await sleep(500);
}

// ====== アクションカード処理 ======
async function playActionCard(index) {
    if (actionUsedThisTurn || window.isBoardSelecting || window.isBoardTargeting) return;
    
    const hand = currentPlayer === 'yellow' ? handYellow : handPurple;
    const card = hand[index];
    if (!card) return;
    if (checkCostStatus(card, currentPlayer) !== 'OK') return;

    window.isBoardSelecting = true;

    const id = card.id;
    let preSelectedCards = [];
    
    // アクション発動前の手札選択（A199, A204）
    if (id === "A199" || id === "A204") { 
        preSelectedCards = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '捨てるカードを選択してください', 'all');
    }
    
    actionUsedThisTurn = true;
    let discarded = hand[index];
    hand[index] = null;
    if (currentPlayer === 'yellow') discardYellow.push(discarded); else discardPurple.push(discarded);
    logDisplay.textContent = `⚡アクション[${discarded.name}]使用！`; 
    renderHands();
    if (isOnlineMode) pushGameStateToFirebase();
    await sleep(300);

    // --- 1. アクション使用時の「制約」処理 ---
    const selfDamageActionIds = ["A126", "A129", "A125", "A202"];
    if (selfDamageActionIds.includes(id)) {
        let { finalDamage: sDmg } = applyDamageReduction(2, 'special', currentPlayer);
        if (currentPlayer === 'yellow') hpYellow -= sDmg; else hpPurple -= sDmg;
        if (sDmg > 0) await showDamageAnimation(`-${sDmg}`, currentPlayer, 'normal');
        logDisplay.textContent = `⚡[制約] 特殊ダメージを受けた！`;
        updateHPUI();
        await sleep(300);
        // HPが0になったらその時点で敗北
        if (hpYellow <= 0 || hpPurple <= 0) {
            if (isOnlineMode) pushGameStateToFirebase(currentPlayer);
            await handleGameOver();
            window.isBoardSelecting = false;
            return;
        }
    }

    // --- 2. アクション使用時の「誓約」条件チェック ---
    const vowActionIds = ["A130", "A128"];
    let vowFailed = false;
    if (vowActionIds.includes(id)) {
        const myHp = currentPlayer === 'yellow' ? hpYellow : hpPurple;
        if (myHp > 60) {
            logDisplay.textContent = `⚡[誓約] 条件を満たしていないため不発！`;
            vowFailed = true;
            await sleep(1000);
        }
    }

    let debuffList = []; let buffTargets = []; let handsChanged = false; let buffLog = false;
    const opponentColor = currentPlayer === 'yellow' ? 'purple' : 'yellow';
    const activeHand = currentPlayer === 'yellow' ? handYellow : handPurple;
    const oppHand = currentPlayer === 'yellow' ? handPurple : handYellow;

    // --- 3. 誓約をクリアした場合のみ能力を発動 ---
    if (!vowFailed) {
        if (id === "A043") {
            buffTargets = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '強化するキャラを選択', 'character');
            buffTargets.forEach(c => { c.atk += 7; handsChanged = true; buffLog = true; });
        }
        else if (id === "A044") {
            const chars = hand.filter(c => c && c.type === 'character');
            buffTargets = chars.sort(() => 0.5 - Math.random()).slice(0, 2);
            buffTargets.forEach(c => { c.atk += 5; handsChanged = true; buffLog = true; });
        }
        else if (id === "A039") {
            buffTargets = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '強化するキャラを選択', 'character');
            buffTargets.forEach(c => { c.atk += 3; handsChanged = true; buffLog = true; });
        }
        else if (id === "A040") {
            const deck = currentPlayer === 'yellow' ? masterDecks.yellow : masterDecks.purple;
            const idx = deck.findIndex(c => c && c.group === '287期受験生' && c.type === 'character');
            if (idx !== -1) {
                const drawnCard = deck.splice(idx, 1)[0];
                drawnCard.atk += 5;
                const emptyIdx = hand.indexOf(null);
                if (emptyIdx !== -1) hand[emptyIdx] = drawnCard;
                else deck.push(drawnCard);
                handsChanged = true;
            }
        }
        else if (id === "A041") {
            if (currentPlayer === 'yellow') hpYellow += 7; else hpPurple += 7;
            await showDamageAnimation(`回復 7`, currentPlayer, 'heal');
        }
        else if (id === "A042") {
            const deck = currentPlayer === 'yellow' ? masterDecks.yellow : masterDecks.purple;
            deck.filter(c => c && c.type === 'character').forEach(c => { c.atk += 2; handsChanged = true; buffLog = true; });
        }
        else if (id === "A152") {
            hand.filter(c => c && c.type === 'character').forEach(c => { c.atk += 1; handsChanged = true; buffLog = true; });
        }
        else if (id === "A198") {
            const deck = currentPlayer === 'yellow' ? masterDecks.yellow : masterDecks.purple;
            deck.filter(c => c && c.type === 'character').forEach(c => { c.atk += 1; handsChanged = true; buffLog = true; });
        }
        else if (id === "A199" || id === "A204") {
            for (let c of preSelectedCards) {
                await animateHandCard(c, currentPlayer, 'card-discard-anim');
                hand[hand.indexOf(c)] = null;
                if (currentPlayer === 'yellow') discardYellow.push(c); else discardPurple.push(c);
                handsChanged = true;
            }
        }
        else if (id === "A158" || id === "A203") {
            drawCards(currentPlayer, 1); handsChanged = true;
        }
        else if (id === "A054") {
            await animateGPFly(14, currentPlayer, '幻影旅団');
            playerGP[currentPlayer].gp['幻影旅団'] = (playerGP[currentPlayer].gp['幻影旅団'] || 0) + 1;
            
            let selectedCards = await selectHandCardsTarget(currentPlayer, opponentColor, 1, '能力を盗むキャラを選択（コスト5以下）', 'steal_a054');
            let chrolloCard = getCardById("0141");
            if (!chrolloCard) chrolloCard = { id: "0141", type: "character", name: "クロロ", rank: "SS", cost: { specific: 0, free: 0 }, atk: 10, group: "幻影旅団" };

            if (selectedCards.length > 0) {
                let target = selectedCards[0];
                chrolloCard.atk = 30;
                chrolloCard.ability = target.ability;
                chrolloCard.combo = target.combo;
                chrolloCard.stolenFromId = target.id; 
                
                target.ability = null;
                target.combo = null;
                target.stolen = true; 
                logDisplay.textContent = `🃏相手の能力を盗んだ！`;
            } else {
                logDisplay.textContent = `🃏盗む対象がいなかった...`;
            }
            hand[index] = chrolloCard;
            handsChanged = true;
        }
        else if (id === "A087") {
            await animateGPFly(14, currentPlayer, '幻影旅団');
            playerGP[currentPlayer].gp['幻影旅団'] = (playerGP[currentPlayer].gp['幻影旅団'] || 0) + 1;
            const chars = oppHand.filter(c => c && c.type === 'character');
            if (chars.length > 0) {
                const target = chars[Math.floor(Math.random() * chars.length)];
                target.atk = Math.max(0, target.atk - 4);
                logDisplay.textContent = `相手の手札のATKを-4!`;
                handsChanged = true;
            }
        }
        else if (id === "A082") {
            const beforeGP = playerGP[currentPlayer].gp['幻影旅団'] || 0;
            await animateGPFly(14, currentPlayer, '幻影旅団');
            playerGP[currentPlayer].gp['幻影旅団'] = beforeGP + 1;
            if (beforeGP >= 10) {
                if (currentPlayer === 'yellow') hpYellow += 11; else hpPurple += 11;
                await showDamageAnimation(`回復 11`, currentPlayer, 'heal');
            }
        }
        else if (id === "A084") {
            oppHand.filter(c => c && c.type === 'character').forEach(c => {
                c.atk = Math.max(0, c.atk - 4);
                handsChanged = true;
            });
            logDisplay.textContent = `相手の手札すべてのATKを-4!`;
            await sleep(500);
        }
        else if (id === "A085") {
            if (currentPlayer === 'yellow') hpYellow += 10; else hpPurple += 10;
            await showDamageAnimation(`回復 10`, currentPlayer, 'heal');
        }
        else if (id === "A086") {
            const oppCharIndices = [];
            boardData.forEach((c, idx) => { if (c && c.type === 'character' && c.color === opponentColor) oppCharIndices.push(idx); });
            
            if (oppCharIndices.length === 0) {
                logDisplay.textContent = '効果対象なし';
                await sleep(1000);
            } else {
                let targetIdx = -1;
                if (currentPlayer !== myColor) {
                    targetIdx = oppCharIndices[Math.floor(Math.random() * oppCharIndices.length)];
                } else {
                    logDisplay.textContent = '空にする相手のキャラを選択してください';
                    targetIdx = await selectBoardTarget(oppCharIndices);
                }
                if (targetIdx !== -1) {
                    boardData[targetIdx] = { color: opponentColor, type: 'stone', name: '' };
                    logDisplay.textContent = 'キャラを空のカードにしました';
                    renderBoard();
                    await sleep(500);
                }
            }
        }
        else if (id === "A083") {
            const validTargets = oppHand.filter(c => c && (c.cost.specific + c.cost.free) <= 3);
            if (validTargets.length === 0) {
                logDisplay.textContent = '効果対象なし';
                await sleep(1000);
            } else {
                const target = validTargets[Math.floor(Math.random() * validTargets.length)];
                await animateHandCard(target, opponentColor, 'card-discard-anim');
                oppHand[oppHand.indexOf(target)] = null;
                if (opponentColor === 'yellow') discardYellow.push(target); else discardPurple.push(target);
                logDisplay.textContent = `相手のカードを捨てさせた!`;
                handsChanged = true;
            }
        }
        else if (id === "A163") {
            const deck = currentPlayer === 'yellow' ? masterDecks.yellow : masterDecks.purple;
            const targetIdx = deck.findIndex(c => c && c.type === 'character' && (c.cost.specific + c.cost.free) >= 3);
            if (targetIdx !== -1) {
                const drawn = deck.splice(targetIdx, 1)[0];
                const emptyIdx = hand.indexOf(null);
                if (emptyIdx !== -1) hand[emptyIdx] = drawn;
                else deck.push(drawn);
                logDisplay.textContent = 'キャラを引いた!';
                handsChanged = true;
            } else {
                logDisplay.textContent = '効果対象なし';
            }
            await sleep(1000);
        }
        else if (id === "A200") {
            const nonNulls = hand.filter(c => c !== null);
            if (nonNulls.length > 0) {
                const targets = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, 'デッキに戻すカードを選択してください', 'all');
                if (targets.length > 0) {
                    const target = targets[0];
                    await animateHandCard(target, currentPlayer, 'card-return-anim');
                    hand[hand.indexOf(target)] = null;
                    const deck = currentPlayer === 'yellow' ? masterDecks.yellow : masterDecks.purple;
                    deck.push(target);
                    shuffleDeck(deck);
                    handsChanged = true;
                }
            }
        }
        // 以下、追加されたマフィアンアクション
        else if (id === "A126") {
            let { finalDamage: aFinalDmg, reduction: aRed } = applyDamageReduction(6, 'special', opponentColor);
            if (aRed > 0) await showDamageAnimationReduction(aRed, aFinalDmg, opponentColor);
            else await showDamageAnimation(`能力 ${aFinalDmg}`, opponentColor);
            
            if (currentPlayer === 'yellow') hpPurple -= aFinalDmg; else hpYellow -= aFinalDmg;
        }
        else if (id === "A130") {
            if (currentPlayer === 'yellow') hpYellow += 15; else hpPurple += 15;
            await showDamageAnimation(`回復 15`, currentPlayer, 'heal');
        }
        else if (id === "A127") {
            const validIndices = [];
            boardData.forEach((c, idx) => {
                if (c && c.type === 'character' && c.color === opponentColor && (c.cost.specific + c.cost.free) <= 1) {
                    validIndices.push(idx);
                }
            });
            if (validIndices.length > 0) {
                let targetIdx = -1;
                if (currentPlayer !== myColor) {
                    targetIdx = validIndices[Math.floor(Math.random() * validIndices.length)];
                } else {
                    logDisplay.textContent = '空にする相手のキャラを選択してください';
                    targetIdx = await selectBoardTarget(validIndices);
                }
                if (targetIdx !== -1) {
                    boardData[targetIdx] = { color: opponentColor, type: 'stone', name: '' };
                    logDisplay.textContent = 'キャラを空のカードにしました';
                    renderBoard();
                    await sleep(500);
                }
            } else {
                logDisplay.textContent = '効果対象なし';
                await sleep(1000);
            }
        }
        else if (id === "A128") {
            const validTargets = oppHand.filter(c => c && (c.cost.specific + c.cost.free) <= 5);
            if (validTargets.length > 0) {
                const target = validTargets[Math.floor(Math.random() * validTargets.length)];
                await animateHandCard(target, opponentColor, 'card-discard-anim');
                oppHand[oppHand.indexOf(target)] = null;
                if (opponentColor === 'yellow') discardYellow.push(target); else discardPurple.push(target);
                logDisplay.textContent = `相手のカードを捨てさせた!`;
                handsChanged = true;
            }
        }
        else if (id === "A129") {
            const chars = oppHand.filter(c => c && c.type === 'character');
            if (chars.length > 0) {
                const target = chars[Math.floor(Math.random() * chars.length)];
                target.atk = Math.max(0, target.atk - 10);
                logDisplay.textContent = `相手の手札のATKを-10!`;
                handsChanged = true;
            }
        }
        else if (id === "A144") {
            const myEmptyIndices = boardData.map((c, i) => (c && c.type === 'stone' && c.color === currentPlayer) ? i : -1).filter(i => i !== -1);
            if (myEmptyIndices.length > 0) {
                const targetIdx = myEmptyIndices[Math.floor(Math.random() * myEmptyIndices.length)];
                const spawnCard = getCardById("0148");
                if (spawnCard) {
                    spawnCard.color = currentPlayer;
                    boardData[targetIdx] = spawnCard;
                    logDisplay.textContent = `⚡空のカードが「殺し屋」に変わった！`;
                    renderBoard();
                    if (isOnlineMode) pushGameStateToFirebase();
                    await sleep(500);
                }
            } else {
                logDisplay.textContent = `効果対象（自分の空のカード）なし`;
                await sleep(1000);
            }
        }
        else if (id === "A168") {
            const hasKurapika = boardData.some(c => c && c.type === 'character' && c.color === currentPlayer && c.name === 'クラピカ');
            if (hasKurapika) {
                const etIds = ["0137", "0138", "0139", "0140"];
                for (let i = 0; i < 4; i++) {
                    if (hand[i]) {
                        hand[i] = getCardById(etIds[Math.floor(Math.random() * etIds.length)]);
                    }
                }
                handsChanged = true;
                logDisplay.textContent = `⚡緋の眼が発現！手札が変化した！`;
            } else {
                logDisplay.textContent = `盤面にクラピカがいないため不発！`;
                await sleep(1000);
            }
        }
        else if (id === "A125") {
            const oppDeck = opponentColor === 'yellow' ? masterDecks.yellow : masterDecks.purple;
            oppDeck.filter(c => c && c.type === 'character').forEach(c => { c.atk = Math.max(0, c.atk - 3); });
            logDisplay.textContent = `⚡相手のデッキをデバフ！`;
        }
        else if (id === "A202") {
            const oppDeck = opponentColor === 'yellow' ? masterDecks.yellow : masterDecks.purple;
            oppDeck.filter(c => c && c.type === 'character').forEach(c => { c.atk = Math.max(0, c.atk - 1); });
            logDisplay.textContent = `⚡相手のデッキをデバフ！`;
        }
    }

    if (handsChanged) {
        if (buffLog) logDisplay.textContent = `⚡手札に効果適用！`;
        renderHands();
    }

    updateHPUI(); updateHighlightsAndLines();
    window.isBoardSelecting = false;
    
    if (hpYellow <= 0 || hpPurple <= 0) { 
        if (isOnlineMode) pushGameStateToFirebase(currentPlayer);
        await handleGameOver(); 
        return; 
    }
    if (isOnlineMode) pushGameStateToFirebase();
}

function getFlippableAndTriggers(index, player) {
    if (boardData[index] !== null) return { flippable: [], triggers: [] };
    const opponent = player === 'yellow' ? 'purple' : 'yellow';
    const flippable = []; const triggers = []; 
    const cx = index % boardSize; const cy = Math.floor(index / boardSize);
    for (const [dx, dy] of directions) {
        let x = cx + dx; let y = cy + dy; let tempFlippable = [];
        while (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
            const tIdx = y * boardSize + x; const tCard = boardData[tIdx];
            if (tCard && tCard.color === opponent) tempFlippable.push(tIdx);
            else if (tCard && tCard.color === player) { 
                if (tempFlippable.length > 0) { flippable.push(...tempFlippable); triggers.push(tIdx); } 
                break; 
            } else break;
            x += dx; y += dy;
        }
    }
    return { flippable, triggers };
}

function applyDamageReduction(damage, dmgType, targetPlayer) {
    let totalReduction = 0;
    
    boardData.forEach(c => {
        if (c && (c.id === "0091" || c.id === "0105") && c.color === targetPlayer) {
            const currentHp = targetPlayer === 'yellow' ? hpYellow : hpPurple;
            if (currentHp <= 100) {
                totalReduction += 1;
            }
        }
    });

    activeEffects.forEach(effect => {
        if (effect.player === targetPlayer && effect.turnsLeft > 0) {
            if (effect.type === 'reduce_damage_all' || effect.type === 'reduce_damage_normal') {
                let card = boardData[effect.index];
                if (card && card.id === effect.cardId && card.color === targetPlayer) {
                    if (effect.type === 'reduce_damage_all' || (effect.type === 'reduce_damage_normal' && dmgType === 'normal')) {
                        totalReduction += effect.amount;
                    }
                }
            }
            if (effect.type === 'reduce_damage_taken' && dmgType === 'normal') {
                totalReduction += effect.amount;
            }
        }
    });

    let finalDamage = damage - totalReduction;
    return { finalDamage: Math.max(damage > 0 ? 1 : 0, finalDamage), reduction: totalReduction };
}

async function showDamageAnimation(damageText, targetPlayer, colorClass = 'normal', broadcast = true) {
    if (isOnlineMode && broadcast && currentPlayer === myColor) {
        db.ref('rooms/' + currentRoomId).update({ damageAnim: { damageText, targetPlayer, colorClass, ts: Date.now() } });
    }
    const popup = document.createElement('div');
    popup.className = `damage-popup ${colorClass}`;
    popup.textContent = damageText;
    document.getElementById('app-container').appendChild(popup);
    
    await sleep(50);
    popup.classList.add('show');
    await sleep(600); 
    
    popup.classList.add(targetPlayer === opColor ? 'fly-top' : 'fly-bottom');
    await sleep(400); 
    popup.remove();
}

async function showDamageAnimationReduction(reduction, finalDmg, targetPlayer, broadcast = true) {
    if (isOnlineMode && broadcast && currentPlayer === myColor) {
        db.ref('rooms/' + currentRoomId).update({ damageRedAnim: { reduction, finalDmg, targetPlayer, ts: Date.now() } });
    }
    const popup = document.createElement('div');
    popup.className = `damage-popup reduce`;
    popup.textContent = `-${reduction}`;
    document.getElementById('app-container').appendChild(popup);

    await sleep(50);
    popup.classList.add('show');
    await sleep(800);

    popup.textContent = finalDmg; 
    await sleep(600);

    popup.classList.add(targetPlayer === opColor ? 'fly-top' : 'fly-bottom');
    await sleep(400);
    popup.remove();
}

async function animateGPFly(startIndex, playerColor, group, broadcast = true) {
    if (isOnlineMode && broadcast && currentPlayer === myColor) {
        db.ref('rooms/' + currentRoomId).update({ gpFlyAnim: { startIndex, playerColor, group, ts: Date.now() } });
    }
    let color = '#fff';
    if (group === 'フリー') color = '#7f8c8d';
    if (group === '幻影旅団') color = '#8e44ad';
    if (group === '287期受験生') color = '#2ecc71';
    if (group === 'マフィアンコミュニティー') color = '#e74c3c';
    
    const cell = boardElement.children[startIndex];
    if (!cell) return;
    const cellRect = cell.getBoundingClientRect();
    
    const gpBtnId = playerColor === myColor ? 'gp-btn-bottom' : 'gp-btn-top'; 
    const gpBtn = document.getElementById(gpBtnId);
    if (!gpBtn) return;
    const btnRect = gpBtn.getBoundingClientRect();
    
    const particle = document.createElement('div');
    particle.className = 'gp-fly-particle';
    particle.style.background = color;
    particle.style.color = color;
    particle.style.left = `${cellRect.left + 20}px`;
    particle.style.top = `${cellRect.top + 20}px`;
    document.body.appendChild(particle);

    await sleep(50);
    particle.style.left = `${btnRect.left + 40}px`;
    particle.style.top = `${btnRect.top + 10}px`;
    
    await sleep(600);
    particle.remove();
}

// ====== 戦闘・ダメージ計算 ======
async function executeCombat(index, playerColor, finalCard, result) {
    const targetPlayer = playerColor === 'yellow' ? 'purple' : 'yellow';
    const abilityId = finalCard.stolenFromId || finalCard.id;

    let hasOpponentCharFlipped = false;
    let hasNonTroupeFlipped = false;
    let flipDefReduction = 0;

    result.flippable.forEach(idx => {
        const tc = boardData[idx];
        if (tc && tc.type === 'character') { 
            if (tc.color !== playerColor) {
                hasOpponentCharFlipped = true;
                if (tc.id === "0061" || tc.id === "0077") flipDefReduction += 5;
                if (tc.group !== '幻影旅団') hasNonTroupeFlipped = true;
            }
            if (tc.color === 'yellow') discardYellow.push(tc); 
            else discardPurple.push(tc); 
        }
        boardData[idx] = { color: playerColor, type: 'stone', name: '' };
    });
    
    if (abilityId === "0138" && hasNonTroupeFlipped) {
        logDisplay.textContent = `💀制約違反！敗北します...`;
        if (playerColor === 'yellow') hpYellow = 0; else hpPurple = 0;
        updateHPUI();
        if (isOnlineMode) pushGameStateToFirebase();
        return true;
    }

    renderBoard();
    if (isOnlineMode) pushGameStateToFirebase();
    await sleep(400);
    
    let baseAtk = finalCard.atk;
    let flipBonus = result.flippable.length >= 2 ? (result.flippable.length * 2 - 3) : 0;
    
    const popup = document.createElement('div');
    popup.className = 'damage-popup normal';
    document.getElementById('app-container').appendChild(popup);
    
    await sleep(50);
    popup.textContent = baseAtk;
    popup.classList.add('show');
    await sleep(600);

    let totalNormalDamage = baseAtk;
    if (flipBonus > 0) {
        popup.textContent = `${baseAtk} + ${flipBonus}`;
        await sleep(600);
        totalNormalDamage = baseAtk + flipBonus;
        popup.textContent = totalNormalDamage;
        await sleep(500);
    }

    totalNormalDamage = Math.max(0, totalNormalDamage - flipDefReduction);

    let { finalDamage: nFinalDmg, reduction: nRed } = applyDamageReduction(totalNormalDamage, 'normal', targetPlayer);
    if (nRed > 0) {
        popup.textContent = `-${nRed}`;
        popup.className = 'damage-popup reduce show';
        await sleep(800);
        popup.textContent = nFinalDmg; 
        await sleep(600);
    }
    
    popup.classList.add(targetPlayer === opColor ? 'fly-top' : 'fly-bottom');
    await sleep(300); 
    
    if (playerColor === 'yellow') hpPurple -= nFinalDmg; else hpYellow -= nFinalDmg;
    updateHPUI();
    if (isOnlineMode) pushGameStateToFirebase();
    popup.remove();
    await sleep(200);

    if (hpYellow <= 0 || hpPurple <= 0) return true; 

    let pendingDestroyIdx = -1;
    let abilityDamage = 0;

    if (finalCard.ability && finalCard.ability.text) {
        const text = finalCard.ability.text;
        const sMatch = text.match(/特殊ダメージを(\d+)/);
        const nMatch = text.match(/念ダメージを(\d+)/);
        
        if (sMatch && !selfDamageIds.includes(abilityId)) abilityDamage += parseInt(sMatch[1]);
        if (nMatch && !["0075", "0183", "0159"].includes(abilityId)) abilityDamage += parseInt(nMatch[1]);

        if (abilityId === "0183" && hasOpponentCharFlipped) abilityDamage += 5;
        if (abilityId === "0159" && hasOpponentCharFlipped) abilityDamage += 5;
        
        if (abilityId === "0197") {
            let count = boardData.filter(c => c && c.group === 'マフィアンコミュニティー' && c.color === playerColor).length;
            if (count >= 3) abilityDamage += 12;
        }
        
        if (abilityId === "0075") {
            let surroundingOpponentChars = [];
            const cx = index % boardSize; 
            const cy = Math.floor(index / boardSize);
            for (const [dx, dy] of directions) {
                let nx = cx + dx; let ny = cy + dy;
                if (nx >= 0 && nx < boardSize && ny >= 0 && ny < boardSize) {
                    let sIdx = ny * boardSize + nx;
                    let sCard = boardData[sIdx];
                    if (sCard && sCard.type === 'character' && sCard.color === targetPlayer) {
                        surroundingOpponentChars.push(sIdx);
                    }
                }
            }
            if (surroundingOpponentChars.length > 0) {
                pendingDestroyIdx = surroundingOpponentChars[Math.floor(Math.random() * surroundingOpponentChars.length)];
                abilityDamage += 13;
            }
        }

        if (abilityId === "0003") activeEffects.push({ player: playerColor, type: 'leorio_buff', amount: 2, turnsLeft: 3, index: index, cardId: abilityId });
        if (abilityId === "0053") activeEffects.push({ player: playerColor, type: 'feitan_debuff', turnsLeft: 3, index: index, cardId: abilityId });
        if (abilityId === "0057") activeEffects.push({ player: playerColor, type: 'shalnark_debuff', turnsLeft: 3, index: index, cardId: abilityId });
        if (abilityId === "0063") activeEffects.push({ player: playerColor, type: 'machi_heal', turnsLeft: 3, index: index, cardId: abilityId });
        if (abilityId === "0131") activeEffects.push({ player: playerColor, type: 'reduce_damage_taken', amount: 10, turnsLeft: 1, index: index, cardId: abilityId });
        
        const hMatch = text.match(/HPを(\d+)回復/);
        if (hMatch && result.flippable.length >= 2) {
            const heal = parseInt(hMatch[1]);
            logDisplay.textContent = `⚡能力発動！`;
            await showDamageAnimation(`回復 ${heal}`, playerColor, 'heal');
            if (playerColor === 'yellow') hpYellow += heal; else hpPurple += heal;
            updateHPUI();
            if (isOnlineMode) pushGameStateToFirebase();
        }

        if (abilityId === "0137") {
            if (playerColor === 'yellow') hpYellow += 15; else hpPurple += 15;
            await showDamageAnimation(`回復 15`, playerColor, 'heal');
            updateHPUI();
        }

        if (abilityId === "0064" || abilityId === "0067" || abilityId === "0162") {
            const oppHand = playerColor === 'yellow' ? handPurple : handYellow;
            oppHand.filter(c => c && c.type === 'character').forEach(c => { c.atk = Math.max(0, c.atk - (abilityId === "0064" ? 3 : 2)); });
            logDisplay.textContent = `⚡相手の手札をデバフ！`;
            renderHands();
        }

        if (abilityId === "0139") {
            const deck = playerColor === 'yellow' ? masterDecks.yellow : masterDecks.purple;
            const actionIdx = deck.findIndex(c => c && c.type === 'action');
            if (actionIdx !== -1) {
                const act = deck.splice(actionIdx, 1)[0];
                deck.push(act);
                logDisplay.textContent = `⚡デッキからアクションを仕込んだ！`;
            }
        }

        if (abilityId === "0066") activeEffects.push({ player: playerColor, type: 'reduce_damage_all', amount: 2, turnsLeft: 3, index: index, cardId: finalCard.id });
        if (abilityId === "0060") activeEffects.push({ player: playerColor, type: 'reduce_damage_normal', amount: 4, turnsLeft: 4, index: index, cardId: finalCard.id });
    }
    
    if (abilityDamage > 0) {
        logDisplay.textContent = `⚡能力発動！`;
        let { finalDamage: aFinalDmg, reduction: aRed } = applyDamageReduction(abilityDamage, 'special', targetPlayer);
        if (aRed > 0) await showDamageAnimationReduction(aRed, aFinalDmg, targetPlayer);
        else await showDamageAnimation(`能力 ${aFinalDmg}`, targetPlayer);
        
        if (playerColor === 'yellow') hpPurple -= aFinalDmg; else hpYellow -= aFinalDmg;
        updateHPUI();
        if (isOnlineMode) pushGameStateToFirebase();
        await sleep(200);
        if (hpYellow <= 0 || hpPurple <= 0) return true;
    }

    // コンボ処理
    for (let tIdx of result.triggers) {
        const bCard = boardData[tIdx];
        if (bCard && bCard.type === 'character' && bCard.combo && bCard.combo.text) {
            let comboDmg = 0; let comboHeal = 0;
            const sMatch = bCard.combo.text.match(/特殊ダメージを(\d+)/);
            const nMatch = bCard.combo.text.match(/念ダメージを(\d+)/);
            const hMatch = bCard.combo.text.match(/HPを(\d+)回復/);
            
            if (sMatch) comboDmg += parseInt(sMatch[1]);
            if (nMatch) comboDmg += parseInt(nMatch[1]);
            if (hMatch) comboHeal += parseInt(hMatch[1]);

            if (comboDmg > 0) {
                logDisplay.textContent = `🔗[${bCard.name}]コンボ発動！`;
                let { finalDamage: cFinalDmg, reduction: cRed } = applyDamageReduction(comboDmg, 'special', targetPlayer);
                if (cRed > 0) await showDamageAnimationReduction(cRed, cFinalDmg, targetPlayer);
                else await showDamageAnimation(`コンボ ${cFinalDmg}`, targetPlayer);
                
                if (playerColor === 'yellow') hpPurple -= cFinalDmg; else hpYellow -= cFinalDmg;
                updateHPUI();
                if (isOnlineMode) pushGameStateToFirebase();
                await sleep(300);
                if (hpYellow <= 0 || hpPurple <= 0) return true;
            }
            if (comboHeal > 0) {
                logDisplay.textContent = `🔗[${bCard.name}]コンボ発動！`;
                await showDamageAnimation(`回復 ${comboHeal}`, playerColor, 'heal');
                if (playerColor === 'yellow') hpYellow += comboHeal; else hpPurple += comboHeal;
                updateHPUI();
                if (isOnlineMode) pushGameStateToFirebase();
                await sleep(300);
            }
        }
    }

    if (pendingDestroyIdx !== -1) {
        boardData[pendingDestroyIdx] = { color: targetPlayer, type: 'stone', name: '' };
        logDisplay.textContent = `💥ウボォーギンの能力！キャラを破壊！`;
        renderBoard();
        if (isOnlineMode) pushGameStateToFirebase();
        await sleep(500);
    }

    await animateGPFly(index, playerColor, finalCard.group);
    playerGP[playerColor].gp[finalCard.group] = (playerGP[playerColor].gp[finalCard.group] || 0) + 1;
    if (finalCard.ability && (abilityId === "0073" || abilityId === "0072" || abilityId === "0161")) {
        await animateGPFly(index, playerColor, '幻影旅団');
        playerGP[playerColor].gp['幻影旅団'] = (playerGP[playerColor].gp['幻影旅団'] || 0) + 1;
    }

    logDisplay.textContent = ``;
    renderHands();
    return false;
}

// ====== ゲームオーバー処理 ======
async function handleGameOver() {
    if (isGameOver) return;
    isGameOver = true;
    if (timerId) clearInterval(timerId);
    
    let winner = null;
    if (hpYellow <= 0 && hpPurple <= 0) winner = 'draw';
    else if (hpPurple <= 0) winner = 'yellow';
    else if (hpYellow <= 0) winner = 'purple';
    else {
        if (hpYellow > hpPurple) winner = 'yellow';
        else if (hpPurple > hpYellow) winner = 'purple';
        else winner = 'draw';
    }

    await showCenterMessage("FINISH!", "msg-finish", 1000);

    if (winner === 'yellow') {
        document.querySelectorAll('.stone.purple').forEach(el => {
            el.classList.add('fade-out-stone');
            const standee = el.querySelector('.stone-standee');
            if (standee) standee.classList.add('fade-out-stone');
        });
    } else if (winner === 'purple') {
        document.querySelectorAll('.stone.yellow').forEach(el => {
            el.classList.add('fade-out-stone');
            const standee = el.querySelector('.stone-standee');
            if (standee) standee.classList.add('fade-out-stone');
        });
    }
    await sleep(1000);

    let resultMsg = ""; let resultClass = "";
    if (winner === 'draw') {
        resultMsg = "DRAW"; resultClass = "msg-finish";
    } else if (winner === myColor) {
        resultMsg = "YOU WIN"; resultClass = "msg-win-yellow"; 
    } else {
        resultMsg = "YOU LOSE"; resultClass = "msg-lose-purple"; 
    }

    showCenterMessage(resultMsg, resultClass, 0); 
    await sleep(3000);
    
    msgOverlay.classList.remove('show');
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('mode-select-overlay').style.display = 'flex';
}

function checkGameOverAndChangeTurn() {
    window.selectedHandIndex = null; 
    if (timerId) clearInterval(timerId); 
    if (hpYellow <= 0 || hpPurple <= 0 || !boardData.includes(null)) { 
        handleGameOver(); 
        return; 
    }
    currentPlayer = currentPlayer === 'yellow' ? 'purple' : 'yellow'; 
    startTurn();
}

async function applyPendingChanges(discardList, returnList, debuffList, buffTargets, sealTargets, finalCard) {
    const activeHand = currentPlayer === 'yellow' ? handYellow : handPurple;
    const opponentColor = currentPlayer === 'yellow' ? 'purple' : 'yellow';
    const oppHand = opponentColor === 'yellow' ? handYellow : handPurple;
    let handsChanged = false;
    let buffLog = false;

    const abilityId = finalCard && (finalCard.stolenFromId || finalCard.id);
    if (abilityId === "0056") {
        const valid = oppHand.filter(c => c && (c.cost.specific + c.cost.free) === 4);
        if (valid.length > 0) {
            const tgt = valid[Math.floor(Math.random() * valid.length)];
            await animateHandCard(tgt, opponentColor, 'card-discard-anim');
            oppHand[oppHand.indexOf(tgt)] = null;
            if (opponentColor === 'yellow') discardYellow.push(tgt); else discardPurple.push(tgt);
            handsChanged = true;
        }
    }
    if (abilityId === "0100") {
        const myHp = currentPlayer === 'yellow' ? hpYellow : hpPurple;
        if (myHp <= 60) {
            const valid = oppHand.filter(c => c && (c.cost.specific + c.cost.free) === 4);
            if (valid.length > 0) {
                const tgt = valid[Math.floor(Math.random() * valid.length)];
                await animateHandCard(tgt, opponentColor, 'card-discard-anim');
                oppHand[oppHand.indexOf(tgt)] = null;
                if (opponentColor === 'yellow') discardYellow.push(tgt); else discardPurple.push(tgt);
                handsChanged = true;
            }
        }
    }

    if (abilityId === "0058") {
        const deck = currentPlayer === 'yellow' ? masterDecks.yellow : masterDecks.purple;
        const actions = deck.filter(c => c && c.type === 'action');
        if (actions.length > 0) {
            const act = actions[Math.floor(Math.random() * actions.length)];
            deck.push(JSON.parse(JSON.stringify(act)));
            logDisplay.textContent = `⚡アクションを複製して仕込んだ！`;
            await showCopiedCardAnim(act, currentPlayer);
        }
    }

    for (let c of discardList) {
        await animateHandCard(c, currentPlayer, 'card-discard-anim');
        activeHand[activeHand.indexOf(c)] = null;
        if (currentPlayer === 'yellow') discardYellow.push(c); else discardPurple.push(c);
        handsChanged = true;
    }
    for (let c of returnList) {
        await animateHandCard(c, currentPlayer, 'card-return-anim');
        activeHand[activeHand.indexOf(c)] = null;
        const deck = currentPlayer === 'yellow' ? masterDecks.yellow : masterDecks.purple;
        deck.push(c); shuffleDeck(deck);
        handsChanged = true;
    }
    for (let c of sealTargets) {
        c.ability = null;
        c.combo = null;
        c.stolen = true; 
        handsChanged = true;
    }

    for (let i = 0; i < activeEffects.length; i++) {
        let effect = activeEffects[i];
        if (effect.player !== currentPlayer) continue; 

        let effectCard = boardData[effect.index];
        if (!effectCard || effectCard.type !== 'character' || effectCard.id !== effect.cardId || effectCard.color !== effect.player) {
            effect.turnsLeft = 0; 
            continue;
        }

        if (effect.turnsLeft > 0) {
            if (effect.type === 'leorio_buff') {
                const chars = activeHand.filter(c => c && c.type === 'character');
                if (chars.length > 0) {
                    const target = chars[Math.floor(Math.random() * chars.length)];
                    target.atk += effect.amount;
                    handsChanged = true;
                    buffLog = true;
                }
            } else if (effect.type === 'feitan_debuff') {
                const chars = oppHand.filter(c => c && c.type === 'character');
                if (chars.length > 0) {
                    const target = chars[Math.floor(Math.random() * chars.length)];
                    target.atk = Math.max(0, target.atk - 3);
                    handsChanged = true;
                    buffLog = true;
                }
            } else if (effect.type === 'shalnark_debuff') {
                const chars = oppHand.filter(c => c && c.type === 'character');
                if (chars.length > 0) {
                    const target = chars[Math.floor(Math.random() * chars.length)];
                    target.atk = Math.max(0, target.atk - 4);
                    handsChanged = true;
                    buffLog = true;
                }
            } else if (effect.type === 'machi_heal') {
                if (currentPlayer === 'yellow') hpYellow += 2; else hpPurple += 2;
                updateHPUI();
                logDisplay.textContent = `⚡回復効果適用！`;
            }
            effect.turnsLeft--;
        }
    }
    activeEffects = activeEffects.filter(e => e.turnsLeft > 0);
    
    for (let c of debuffList) { c.atk = Math.max(0, c.atk - 10); handsChanged = true; buffLog = true; }
    
    for (let c of buffTargets) {
        if (abilityId === "0002") c.atk += 3;
        if (abilityId === "0031" || abilityId === "0028") c.atk += 5;
        handsChanged = true;
        buffLog = true;
    }

    if (handsChanged) {
        if (buffLog) logDisplay.textContent = `⚡手札に効果適用！`;
        renderHands();
        if (isOnlineMode) pushGameStateToFirebase();
        await sleep(500);
    }
}

async function placeStone(index) {
    if (window.isBoardSelecting || window.isBoardTargeting || window.selectedHandIndex == null) return;
    const result = getFlippableAndTriggers(index, currentPlayer);
    if (result.flippable.length === 0) return;
    
    const hand = currentPlayer === 'yellow' ? handYellow : handPurple;
    const selectedCard = hand[window.selectedHandIndex];
    if (!selectedCard) return;

    window.isBoardSelecting = true;
    
    hand[window.selectedHandIndex] = null;
    window.selectedHandIndex = null;
    boardContainer.classList.add('tilted');
    document.querySelectorAll('.highlight-box').forEach(el => el.remove());
    if (svgGroup) svgGroup.innerHTML = '';
    
    boardData[index] = { ...selectedCard, color: currentPlayer };
    renderBoard();
    renderHands();
    if (isOnlineMode) pushGameStateToFirebase();

    try {
        const opponentColor = currentPlayer === 'yellow' ? 'purple' : 'yellow';
        const costStatus = checkCostStatus(selectedCard, currentPlayer);
        let triggerMet = checkAbilityMet(selectedCard, index, result.flippable, currentPlayer);
        
        let finalCard = { ...selectedCard, color: currentPlayer };
        
        if (costStatus !== 'OK') {
            finalCard.combo = null; 
            finalCard.ability = null; 
            result.triggers = [];
            let orig = selectedCard.original_atk !== undefined ? selectedCard.original_atk : selectedCard.atk;
            let buffAmount = selectedCard.atk - orig;
            if (isNaN(buffAmount)) buffAmount = 0;
            finalCard.atk = Math.max(0, 1 + buffAmount); 
        } else if (!triggerMet) {
            finalCard.ability = null;
        }

        boardData[index] = finalCard;
        await sleep(500);

        let discardList = []; let returnList = []; let debuffList = []; let buffTargets = []; let sealTargets = [];

        const abilityId = finalCard.stolenFromId || finalCard.id;

        if (costStatus === 'OK' && triggerMet) {
            if (abilityId === "0004" || abilityId === "0010" || abilityId === "0091" || abilityId === "0105") {
                discardList = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '捨てるカードを選択してください', 'all');
            }
            if (abilityId === "0046" || abilityId === "0048" || abilityId === "0059" || abilityId === "0068") {
                returnList = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, 'デッキに戻すカードを選択してください', 'all');
            }
            if (abilityId === "0140") {
                sealTargets = await selectHandCardsTarget(currentPlayer, opponentColor, 1, '能力を封じる相手の手札を選択', 'character');
            }
            if (abilityId === "0070") {
                debuffList = await selectHandCardsTarget(currentPlayer, opponentColor, 1, 'ATKを下げる相手の手札を選択', 'debuff');
            }
            if (abilityId === "0002" || abilityId === "0031") {
                buffTargets = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '強化するキャラを選択', 'character');
            }
            if (abilityId === "0028") {
                const activeHand = currentPlayer === 'yellow' ? handYellow : handPurple;
                const chars = activeHand.filter(c => c && c.type === 'character');
                buffTargets = chars.sort(() => 0.5 - Math.random()).slice(0, 2);
            }
            
            if (selfDamageIds.includes(abilityId)) {
                let { finalDamage: sDmg, reduction: sRed } = applyDamageReduction(2, 'special', currentPlayer);
                if (currentPlayer === 'yellow') hpYellow -= sDmg; else hpPurple -= sDmg;
                if (sDmg > 0) await showDamageAnimation(`-${sDmg}`, currentPlayer, 'normal');
                logDisplay.textContent = `⚡[制約] 特殊ダメージを受けた！`;
                updateHPUI();
                await sleep(300);
                if (hpYellow <= 0 || hpPurple <= 0) {
                    if (isOnlineMode) pushGameStateToFirebase(currentPlayer);
                    await handleGameOver();
                    window.isBoardSelecting = false;
                    return;
                }
            }
        }

        const isGameOverCombat = await executeCombat(index, currentPlayer, finalCard, result);
        if (isGameOverCombat) {
            if (isOnlineMode) pushGameStateToFirebase(currentPlayer);
            await handleGameOver();
            window.isBoardSelecting = false;
            return;
        }

        await applyPendingChanges(discardList, returnList, debuffList, buffTargets, sealTargets, finalCard);

    } catch (error) {
        console.error("Combat Error:", error);
    } finally {
        window.isBoardSelecting = false;
        
        if (!isOnlineMode) {
            checkGameOverAndChangeTurn();
        } else {
            if (hpYellow <= 0 || hpPurple <= 0 || !boardData.some(c => c === null)) {
                if (!isGameOver) {
                    pushGameStateToFirebase(currentPlayer);
                    handleGameOver();
                }
            } else if (currentPlayer === myColor) {
                pushGameStateToFirebase(currentPlayer === 'yellow' ? 'purple' : 'yellow');
            }
        }
    }
}

function startTurnTimer() {
    if (timerId) clearInterval(timerId); 
    const isMe = currentPlayer === myColor; 
    
    const timeTop = document.getElementById('time-container-top');
    const timeBot = document.getElementById('time-container-bottom');
    const timeBoxTop = document.getElementById('timer-box-top');
    const timeBoxBot = document.getElementById('timer-box-bottom');

    if (timeBot && timeTop && timeBoxBot && timeBoxTop) {
        timeBot.style.display = isMe ? 'flex' : 'none';
        timeTop.style.display = !isMe ? 'flex' : 'none';
        timeBoxBot.textContent = timeLeft;
        timeBoxTop.textContent = timeLeft;
    }

    timerId = setInterval(async () => { 
        timeLeft--; 
        if (timeBoxBot && timeBoxTop) {
            timeBoxBot.textContent = timeLeft;
            timeBoxTop.textContent = timeLeft;
        }

        if (timeLeft <= 0) {
            timeLeft = 0;
            if (timeBoxBot) timeBoxBot.textContent = "0";
            if (timeBoxTop) timeBoxTop.textContent = "0";
            clearInterval(timerId);
            
            if (isMe) {
                if (window.isHandSelecting && window.autoSelectAndResolve) {
                    window.autoSelectAndResolve();
                } else if (window.isBoardTargeting && window.autoResolveBoardTarget) {
                    window.autoResolveBoardTarget();
                } else if (!window.isBoardSelecting && !actionUsedThisTurn) {
                    autoPlayTimeout(); 
                }
            }
        }
    }, 1000);
}

function startTurn() {
    actionUsedThisTurn = false; 
    usedThinkThisTurn = false;
    window.selectedHandIndex = null; 
    updateBoardPerspective(); 
    
    drawCards(currentPlayer, 4); updateHPUI();
    document.querySelectorAll('.highlight-box').forEach(el => el.remove()); 
    if (svgGroup) svgGroup.innerHTML = '';
    
    const isMe = currentPlayer === myColor; 
    
    let canMove = false;
    for (let i = 0; i < 36; i++) {
        if (getFlippableAndTriggers(i, currentPlayer).flippable.length > 0) {
            canMove = true;
            break;
        }
    }

    if (!canMove) {
        consecutivePasses++;
        if (consecutivePasses >= 2) {
            handleGameOver();
            return;
        }
        
        logDisplay.textContent = isMe ? "置けるマスがありません（ターンパス）" : "相手はパスしました";
        window.isBoardSelecting = true; 
        showCenterMessage("PASS", "msg-turn", 1500);
        
        const matchId = currentMatchId;
        setTimeout(() => {
            if (matchId !== currentMatchId) return;
            applyPendingChanges([], [], [], [], [], {}).then(() => {
                if (matchId !== currentMatchId) return;
                
                const opponentColor = currentPlayer === 'yellow' ? 'purple' : 'yellow';
                const oppHand = opponentColor === 'yellow' ? handYellow : handPurple;
                let autoHandsChanged = false;
                for (let effect of activeEffects) {
                    if (effect.player === currentPlayer) {
                        let effectCard = boardData[effect.index];
                        if (!effectCard || effectCard.type !== 'character' || effectCard.id !== effect.cardId || effectCard.color !== effect.player) {
                            effect.turnsLeft = 0; 
                            continue;
                        }

                        if (effect.turnsLeft > 0) {
                            if (effect.type === 'machi_heal') {
                                if (currentPlayer === 'yellow') hpYellow += 2; else hpPurple += 2;
                                updateHPUI();
                                effect.turnsLeft--;
                            }
                            if (effect.type === 'feitan_debuff') {
                                const chars = oppHand.filter(c => c && c.type === 'character');
                                if (chars.length > 0) {
                                    const target = chars[Math.floor(Math.random() * chars.length)];
                                    target.atk = Math.max(0, target.atk - 3);
                                    autoHandsChanged = true;
                                }
                                effect.turnsLeft--;
                            }
                            if (effect.type === 'shalnark_debuff') {
                                const chars = oppHand.filter(c => c && c.type === 'character');
                                if (chars.length > 0) {
                                    const target = chars[Math.floor(Math.random() * chars.length)];
                                    target.atk = Math.max(0, target.atk - 4);
                                    autoHandsChanged = true;
                                }
                                effect.turnsLeft--;
                            }
                        }
                    }
                }
                if (autoHandsChanged) renderHands();

                if (isOnlineMode) {
                    if (isMe) pushGameStateToFirebase(currentPlayer === 'yellow' ? 'purple' : 'yellow');
                } else {
                    checkGameOverAndChangeTurn();
                }
            });
        }, 2000);
        return; 
    } else {
        consecutivePasses = 0;
    }

    timeLeft = 30; 
    startTurnTimer();
    
    logDisplay.textContent = ""; 
    showCenterMessage(isMe ? "YOUR TURN" : "ENEMY'S TURN", "msg-turn", 1000);

    const opponentColor = currentPlayer === 'yellow' ? 'purple' : 'yellow';
    const oppHand = opponentColor === 'yellow' ? handYellow : handPurple;
    let autoHandsChanged = false;
    for (let effect of activeEffects) {
        if (effect.player === opponentColor) {
            let effectCard = boardData[effect.index];
            if (!effectCard || effectCard.type !== 'character' || effectCard.id !== effect.cardId || effectCard.color !== effect.player) {
                effect.turnsLeft = 0; 
                continue;
            }

            if (effect.turnsLeft > 0) {
                if (effect.type === 'machi_heal') {
                    if (opponentColor === 'yellow') hpYellow += 2; else hpPurple += 2;
                    updateHPUI();
                    effect.turnsLeft--;
                }
                if (effect.type === 'feitan_debuff') {
                    const myHand = currentPlayer === 'yellow' ? handYellow : handPurple;
                    const chars = myHand.filter(c => c && c.type === 'character');
                    if (chars.length > 0) {
                        const target = chars[Math.floor(Math.random() * chars.length)];
                        target.atk = Math.max(0, target.atk - 3);
                        autoHandsChanged = true;
                    }
                    effect.turnsLeft--;
                }
                if (effect.type === 'shalnark_debuff') {
                    const myHand = currentPlayer === 'yellow' ? handYellow : handPurple;
                    const chars = myHand.filter(c => c && c.type === 'character');
                    if (chars.length > 0) {
                        const target = chars[Math.floor(Math.random() * chars.length)];
                        target.atk = Math.max(0, target.atk - 4);
                        autoHandsChanged = true;
                    }
                    effect.turnsLeft--;
                }
            }
        }
    }
    
    renderBoard(); 
    renderHands();
    
    if (!isMe) { 
        if (!isOnlineMode) {
            const matchId = currentMatchId;
            setTimeout(() => {
                if (matchId === currentMatchId) autoPlayOpponent();
            }, 2500); 
        }
    }
}

async function autoPlayTimeout() {
    logDisplay.textContent = "時間切れ！自動で配置します。";
    window.isBoardSelecting = true;
    const hand = currentPlayer === 'yellow' ? handYellow : handPurple;
    const chars = hand.filter(c => c && c.type === 'character');
    
    if (chars.length > 0) {
        for(let c of chars) {
            let validMoves = [];
            for (let i = 0; i < 36; i++) if (getFlippableAndTriggers(i, currentPlayer).flippable.length > 0) validMoves.push(i);
            if (validMoves.length > 0) {
                let move = validMoves[Math.floor(Math.random() * validMoves.length)];
                window.selectedHandIndex = hand.indexOf(c);
                window.isBoardSelecting = false; 
                await placeStone(move);
                return;
            }
        }
    }
    
    logDisplay.textContent = "配置可能キャラなし！パスします。";
    window.isBoardSelecting = false;
    await applyPendingChanges([], [], [], [], [], {});
    
    if (isOnlineMode) {
        pushGameStateToFirebase(currentPlayer === 'yellow' ? 'purple' : 'yellow');
    } else {
        const matchId = currentMatchId;
        setTimeout(() => {
            if (matchId === currentMatchId) checkGameOverAndChangeTurn();
        }, 1000);
    }
}

async function autoPlayOpponent() {
    const hand = opColor === 'yellow' ? handYellow : handPurple;
    const validActions = hand.filter(c => c && c.type === 'action' && checkCostStatus(c, opColor) === 'OK');
    if (!actionUsedThisTurn && validActions.length > 0 && Math.random() > 0.5) {
        const actionCard = validActions[Math.floor(Math.random() * validActions.length)];
        const index = hand.indexOf(actionCard);
        await playActionCard(index); 
        await sleep(1000);
    }

    window.isBoardSelecting = true;
    const validMoves = [];
    for (let i = 0; i < 36; i++) if (getFlippableAndTriggers(i, currentPlayer).flippable.length > 0) validMoves.push(i);
    const chars = hand.filter(c => c && c.type === 'character');
    
    if (validMoves.length > 0 && chars.length > 0) {
        const randChar = chars[Math.floor(Math.random() * chars.length)];
        window.selectedHandIndex = hand.indexOf(randChar);
        window.isBoardSelecting = false;
        await placeStone(validMoves[Math.floor(Math.random() * validMoves.length)]);
        return;
    }
    
    window.isBoardSelecting = false;
    checkGameOverAndChangeTurn();
}

function renderBoard() {
    boardElement.innerHTML = '';
    for (let i = 0; i < 36; i++) {
        const cell = document.createElement('div'); cell.classList.add('cell');
        
        let hasGlow = false;
        for(let effect of activeEffects) {
            if (effect.turnsLeft > 0 && (effect.type === 'reduce_damage_all' || effect.type === 'reduce_damage_normal')) {
                const checkCard = boardData[effect.index];
                if (checkCard && checkCard.id === effect.cardId && checkCard.color === effect.player && i === effect.index) {
                    hasGlow = true;
                }
            }
        }

        if (boardData[i] !== null && boardData[i] !== undefined) {
            const stone = document.createElement('div'); stone.classList.add('stone', boardData[i].color);
            if (boardData[i].type === 'stone') stone.classList.add('card-stone');
            else { 
                stone.classList.add(`card-${boardData[i].type}`); 
                applyCardImage(stone, boardData[i].id);
                stone.innerHTML = `<div class="card-name card-text-node">${boardData[i].name || ''}</div>`; 
            }
            if(hasGlow) stone.classList.add('active-buff-glow');
            cell.appendChild(stone);

            if (boardData[i].type === 'character') {
                const standee = document.createElement('div');
                standee.className = 'stone-standee';
                
                const standeeImg = document.createElement('div');
                standeeImg.style.width = '100%';
                standeeImg.style.height = '100%';
                applyStandeeImage(standeeImg, boardData[i].id);

                standee.appendChild(standeeImg);
                stone.appendChild(standee); 
            }

        } else if (hasGlow) {
            cell.classList.add('active-buff-glow'); 
        }
        
        cell.addEventListener('click', () => {
            if (currentPlayer === myColor) placeStone(i);
        });
        boardElement.appendChild(cell);
    }
    updateHighlightsAndLines();
}

window.useTimeExtension = function() {
    if (timeLeft <= 0) return; 
    if (currentPlayer === myColor && !usedThinkThisTurn && timeExtendCountMy > 0 && timerId !== null) {
        usedThinkThisTurn = true;
        timeExtendCountMy--;
        document.getElementById(`td-bottom-${3 - timeExtendCountMy}`).classList.add('used');
        timeLeft += 30; 
        
        const tb = document.getElementById('timer-box-bottom');
        if (tb) tb.textContent = timeLeft;
        logDisplay.textContent = `⏳長考(+30秒)を使用！`;
        
        if (isOnlineMode) pushGameStateToFirebase();
    }
};

window.toggleGPPool = function(playerCol) {
    const isTop = playerCol === opColor;
    const panelId = isTop ? 'gp-pool-top' : 'gp-pool-bottom';
    const listId = isTop ? 'gp-list-top' : 'gp-list-bottom';
    const footerId = isTop ? 'gp-footer-top' : 'gp-footer-bottom';
    
    const panel = document.getElementById(panelId);
    if (panel.style.display === 'flex') { panel.style.display = 'none'; return; }

    const poolGP = playerGP[playerCol].gp;
    const listContainer = document.getElementById(listId);
    listContainer.innerHTML = '';
    
    const allGroups = Object.keys(poolGP);
    if(!allGroups.includes('フリー')) allGroups.unshift('フリー');

    allGroups.forEach(group => {
        let color = '#fff'; let icon = 'G';
        if (group === 'フリー') { color = '#7f8c8d'; icon = 'F'; }
        if (group === '幻影旅団') { color = '#8e44ad'; icon = '🕷'; }
        if (group === '287期受験生') { color = '#2ecc71'; icon = '試'; }
        if (group === 'マフィアンコミュニティー') { color = '#e74c3c'; icon = 'M'; }
        
        let amt = poolGP[group] || 0;
        let diamondsHtml = ''; for(let i=0; i<amt; i++) diamondsHtml += `<div class="gp-pool-diamond" style="background:${color}"></div>`;
        
        listContainer.innerHTML += `
            <div class="gp-item-row">
                <div class="gp-icon-circle" style="border-color:${color}; color:${color}">${icon}</div>
                <div class="gp-amt" style="color:${color}">${amt}</div>
                <div class="gp-diamonds">${diamondsHtml}</div>
            </div>`;
    });
    
    const deckLen = playerCol === 'yellow' ? masterDecks.yellow.length : masterDecks.purple.length;
    const discard = playerCol === 'yellow' ? discardYellow : discardPurple;
    const dChar = discard.filter(c => c && c.type === 'character').length;
    const dAct = discard.filter(c => c && c.type === 'action').length;
    
    document.getElementById(footerId).textContent = `残りデッキ ${deckLen}枚 / 捨て場 C:${dChar} A:${dAct}`;
    panel.style.display = 'flex';
};

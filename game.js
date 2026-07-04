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
    .active-buff-glow { box-shadow: 0 0 10px 3px #f1c40f !important; }
`;
document.head.appendChild(animStyles);

const boardElement = document.getElementById('board');
const boardContainer = document.getElementById('board-container');
const svgGroup = document.getElementById('combo-lines-group');
const logDisplay = document.getElementById('log-display');
const timeLeftDisplay = document.getElementById('timer-box');
const boardSize = 6;

let currentRoomId = null;
let isHost = false;
let myDeckChoice = "";
let isOnlineMode = false;

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
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

window.checkPassword = function() {
    const pwd = document.getElementById('site-password').value;
    if (pwd === "aribato") { 
        document.getElementById('password-overlay').style.display = 'none';
        document.getElementById('mode-select-overlay').style.display = 'flex';
    } else {
        document.getElementById('password-error').style.display = 'block';
    }
};

function getCardById(idStr) {
    const card = CARD_DATABASE.find(c => c.id === idStr);
    return card ? JSON.parse(JSON.stringify({ ...card, original_atk: card.atk })) : null;
}

function buildFixedDeck(deckType) {
    let deck = [];
    let ids = deckType === '287期受験生' ? 
        ["A043","A043","A040","A040","A044","A039","0016","0016","0023","0023","0032","0032","0036","0036","0002","0002","0003","0003","0004","0004","0010","0010","0028","0028","0031","0031","0022","0022","0157","0157"] :
        ["A054","A054","A087","A087","A082","A082","0055","0055","0066","0066","0073","0073","0075","0075","0046","0046","0048","0048","0183","0183","0064","0064","0070","0070","0065","0065","0060","0060","0160","0160"];
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
    if(isOnlineMode) {
        alert("オンライン対戦は現在調整中のため、オフライン対戦をお楽しみください。");
        return;
    }
    document.getElementById('mode-select-overlay').style.display = 'none';
    document.getElementById('deck-select-overlay').style.display = 'flex';
};

window.selectDeck = function(deckName) {
    myDeckChoice = deckName;
    document.getElementById('deck-select-overlay').style.display = 'none';
    startOfflineGame(deckName);
};

window.startOfflineGame = function(selectedDeck) {
    document.getElementById('app-container').style.display = 'flex';
    
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
    
    playerGP = { yellow: { gp: {} }, purple: { gp: {} } };
    
    const secondPlayer = isYouFirst ? opColor : myColor;
    playerGP[secondPlayer].gp['フリー'] = 1;
    
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

async function selectHandCardsTarget(actingPlayer, targetPlayer, count, message, filterType = 'all') {
    const rawHand = targetPlayer === 'yellow' ? handYellow : handPurple;
    let validCards = rawHand.filter(c => c !== null);
    if (filterType === 'debuff') {
        const chars = validCards.filter(c => c.type === 'character');
        if (chars.length === 0) { logDisplay.textContent = '効果対象なし'; await sleep(1000); return []; }
        validCards = chars;
    } else if (filterType === 'character') {
        validCards = validCards.filter(c => c.type === 'character');
    }
    if (validCards.length === 0) return [];
    if (filterType !== 'debuff' && validCards.length <= count) return [...validCards];
    if (actingPlayer !== myColor) return validCards.sort(() => 0.5 - Math.random()).slice(0, count);

    window.isHandSelecting = true;
    document.getElementById('time-container').style.zIndex = '10001';
    return new Promise(resolve => {
        const overlay = document.getElementById('hand-select-overlay');
        const grid = document.getElementById('hand-select-grid');
        const okBtn = document.getElementById('hand-select-ok-btn');
        document.getElementById('hand-select-title').textContent = message;
        grid.innerHTML = '';
        let selectedCards = [];
        window.autoSelectAndResolve = () => { closeHandSelection(overlay, resolve, validCards.sort(() => 0.5 - Math.random()).slice(0, count)); };
        validCards.forEach(card => {
            const el = document.createElement('div');
            el.className = `hand-card card-${card.type}`;
            el.style.backgroundImage = card.id ? `url('cards/${card.id}.png')` : '';
            el.innerHTML = `<div class="card-atk-text">${card.type==='action'?'A':card.atk}</div>`;
            el.onclick = () => {
                const idx = selectedCards.indexOf(card);
                if (idx > -1) { selectedCards.splice(idx, 1); el.style.border = ""; } 
                else if (selectedCards.length < count) { selectedCards.push(card); el.style.border = "3px solid #00d2ff"; }
                okBtn.style.opacity = selectedCards.length === count ? '1' : '0.5';
            };
            grid.appendChild(el);
        });
        overlay.style.display = 'flex';
        okBtn.onclick = () => { if (selectedCards.length === count) closeHandSelection(overlay, resolve, selectedCards); };
    });
}

function closeHandSelection(overlay, resolve, selectedCards) {
    overlay.style.display = 'none';
    window.isHandSelecting = false;
    window.autoSelectAndResolve = null;
    document.getElementById('time-container').style.zIndex = '5';
    resolve(selectedCards);
}

async function selectBoardTarget(validIndices) {
    window.isBoardTargeting = true;
    document.getElementById('time-container').style.zIndex = '10001';
    validIndices.forEach(idx => {
        const cell = boardElement.children[idx];
        const hl = document.createElement('div'); hl.className = 'highlight-box target-hl';
        hl.style.cssText = 'border:2px solid #ffd700; cursor:crosshair;';
        cell.appendChild(hl);
    });
    return new Promise(resolve => {
        const clickHandler = (e) => {
            const cell = e.target.closest('.cell');
            if (!cell) return;
            const idx = Array.from(boardElement.children).indexOf(cell);
            if (validIndices.includes(idx)) cleanup(idx);
        };
        const cleanup = (resultIdx) => {
            boardElement.removeEventListener('click', clickHandler);
            document.querySelectorAll('.target-hl').forEach(el => el.remove());
            window.isBoardTargeting = false;
            window.autoResolveBoardTarget = null;
            document.getElementById('time-container').style.zIndex = '5';
            resolve(resultIdx);
        };
        window.autoResolveBoardTarget = () => cleanup(validIndices[0]);
        boardElement.addEventListener('click', clickHandler);
    });
}

function createCardElementUI(card, index, playerColor, isHandCard = true) {
    if (!card) return document.createElement('div');
    const el = document.createElement('div');
    el.className = `hand-card card-${card.type}`;
    if (card.id) el.style.backgroundImage = `url('cards/${card.id}.png')`;
    el.innerHTML = `<div class="card-atk-text">${card.type==='action'?'A':card.atk}</div>`;
    return el;
}

function updateHighlightsAndLines() {
    document.querySelectorAll('.highlight-box:not(.target-hl)').forEach(el => el.remove());
    if (svgGroup) svgGroup.innerHTML = '';
    if (window.selectedHandIndex == null || currentPlayer !== myColor) return;
    const card = (myColor === 'yellow' ? handYellow : handPurple)[window.selectedHandIndex];
    if (!card || card.type !== 'character') return;
    for (let i = 0; i < 36; i++) {
        if (boardData[i] === null && getFlippableAndTriggers(i, myColor).flippable.length > 0) {
            const hl = document.createElement('div'); hl.className = 'highlight-box';
            boardElement.children[i].appendChild(hl);
        }
    }
}

function renderHands() {
    const topArea = document.getElementById('hand-top'); const bottomArea = document.getElementById('hand-bottom');
    topArea.innerHTML = ''; bottomArea.innerHTML = '';
    (myColor === 'yellow' ? handYellow : handPurple).forEach((card, i) => {
        const el = createCardElementUI(card, i, myColor);
        el.onclick = () => { 
            if (currentPlayer === myColor) { 
                window.selectedHandIndex = (window.selectedHandIndex === i) ? null : i; 
                renderHands(); updateHighlightsAndLines();
            } 
        };
        if (window.selectedHandIndex === i) el.classList.add('selected');
        bottomArea.appendChild(el);
    });
}

async function startMulliganPhase() {
    drawCards('yellow', 4); drawCards('purple', 4); updateHPUI();
    document.getElementById('mulligan-overlay').style.display = 'flex';
    document.getElementById('mulligan-ok-btn').onclick = () => {
        document.getElementById('mulligan-overlay').style.display = 'none';
        startTurn();
    };
}

async function animateHandCard(card, playerColor, animClass) {
    const hand = playerColor === 'yellow' ? handYellow : handPurple;
    const idx = hand.indexOf(card);
    if (idx > -1) {
        const container = document.getElementById(playerColor === myColor ? 'hand-bottom' : 'hand-top');
        container.children[idx].classList.add(animClass);
    }
    await sleep(500);
}

async function playActionCard(index) {
    if (actionUsedThisTurn || window.isBoardSelecting) return;
    const hand = currentPlayer === 'yellow' ? handYellow : handPurple;
    const card = hand[index];
    if (checkCostStatus(card, currentPlayer) !== 'OK') return;
    actionUsedThisTurn = true;
    hand[index] = null;
    logDisplay.textContent = `アクション発動: ${card.name}`;
    renderHands();
    await sleep(500);
    // (各種カード効果処理...省略)
    checkGameOverAndChangeTurn();
}

function getFlippableAndTriggers(index, player) {
    if (boardData[index] !== null) return { flippable: [], triggers: [] };
    const opponent = player === 'yellow' ? 'purple' : 'yellow';
    const flippable = []; const triggers = []; 
    const cx = index % boardSize; const cy = Math.floor(index / boardSize);
    for (const [dx, dy] of directions) {
        let x = cx + dx; let y = cy + dy; let temp = [];
        while (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
            const tIdx = y * boardSize + x; const tCard = boardData[tIdx];
            if (tCard && tCard.color === opponent) temp.push(tIdx);
            else if (tCard && tCard.color === player) { if (temp.length > 0) { flippable.push(...temp); triggers.push(tIdx); } break; }
            else break;
            x += dx; y += dy;
        }
    }
    return { flippable, triggers };
}

function applyDamageReduction(damage, dmgType, targetPlayer) {
    return { finalDamage: Math.max(1, damage), reduction: 0 };
}

async function animateGPFly(startIndex, playerColor, group) {
    const cell = boardElement.children[startIndex];
    if (!cell) return;
    const cellRect = cell.getBoundingClientRect();
    const gpBtn = document.getElementById(playerColor === myColor ? 'gp-btn-bottom' : 'gp-btn-top');
    if (!gpBtn) return;
    const btnRect = gpBtn.getBoundingClientRect();
    const particle = document.createElement('div');
    particle.className = 'gp-fly-particle';
    particle.style.cssText = `position:fixed; left:${cellRect.left}px; top:${cellRect.top}px; width:20px; height:20px; background:gold;`;
    document.body.appendChild(particle);
    await sleep(50);
    particle.style.transition = 'all 0.5s';
    particle.style.left = `${btnRect.left}px`;
    particle.style.top = `${btnRect.top}px`;
    await sleep(500);
    particle.remove();
}

async function executeCombat(index, playerColor, selectedCard) {
    const result = getFlippableAndTriggers(index, playerColor);
    boardData[index] = { ...selectedCard, color: playerColor };
    result.flippable.forEach(idx => boardData[idx].color = playerColor);
    renderBoard();
    await animateGPFly(index, playerColor, selectedCard.group);
}

async function placeStone(index) {
    if (currentPlayer !== myColor || window.isBoardSelecting || window.isBoardTargeting || window.selectedHandIndex == null) return;
    if (getFlippableAndTriggers(index, currentPlayer).flippable.length === 0) return;
    
    const hand = currentPlayer === 'yellow' ? handYellow : handPurple;
    const selectedCard = hand[window.selectedHandIndex];
    if (!selectedCard) return;

    window.isBoardSelecting = true;
    hand[window.selectedHandIndex] = null;
    window.selectedHandIndex = null;
    
    document.querySelectorAll('.highlight-box').forEach(el => el.remove());
    if (svgGroup) svgGroup.innerHTML = '';

    try {
        await executeCombat(index, currentPlayer, selectedCard);
    } catch (e) {
        console.error(e);
    } finally {
        window.isBoardSelecting = false;
        checkGameOverAndChangeTurn();
    }
}

function checkGameOverAndChangeTurn() {
    window.selectedHandIndex = null;
    currentPlayer = currentPlayer === 'yellow' ? 'purple' : 'yellow';
    startTurn();
}

function startTurn() {
    renderBoard(); renderHands();
}

function renderBoard() {
    boardElement.innerHTML = '';
    for (let i = 0; i < 36; i++) {
        const cell = document.createElement('div'); cell.className = 'cell';
        if (boardData[i]) {
            const stone = document.createElement('div'); stone.className = `stone ${boardData[i].color}`;
            cell.appendChild(stone);
        }
        cell.onclick = () => placeStone(i);
        boardElement.appendChild(cell);
    }
}

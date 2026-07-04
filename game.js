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

let myMulliganReady = false;
let opMulliganReady = false;

let playerGP = { yellow: { gp: {} }, purple: { gp: {} } };
let discardYellow = []; let discardPurple = [];
let handYellow = [null, null, null, null]; 
let handPurple = [null, null, null, null];
let masterDecks = {};
let activeEffects = []; 

let timeExtendCountMy = 3; 
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ====== パスワード認証 ======
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

// ====== モード選択・マッチング処理 ======
window.selectMode = function(mode) {
    isOnlineMode = (mode === 'online');
    document.getElementById('mode-select-overlay').style.display = 'none';
    document.getElementById('deck-select-overlay').style.display = 'flex';
};

window.selectDeck = function(deckName) {
    myDeckChoice = deckName;
    document.getElementById('deck-select-overlay').style.display = 'none';
    
    if (isOnlineMode) {
        document.getElementById('room-select-overlay').style.display = 'flex';
        document.getElementById('selected-deck-name').textContent = deckName;
    } else {
        startOfflineGame(deckName);
    }
};

window.createRoom = function() {
    currentRoomId = Math.floor(1000 + Math.random() * 9000).toString();
    isHost = true;
    db.ref('rooms/' + currentRoomId).set({ status: 'waiting', hostDeckChoice: myDeckChoice });
    document.getElementById('room-select-overlay').style.display = 'none';
    document.getElementById('waiting-overlay').style.display = 'flex';
    document.getElementById('display-room-id').textContent = currentRoomId;

    db.ref('rooms/' + currentRoomId).on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        
        if (data.status === 'playing' && data.guestDeckChoice && !data.decksGenerated) {
            const hostDeckData = buildFixedDeck(myDeckChoice);
            const guestDeckData = buildFixedDeck(data.guestDeckChoice);
            db.ref('rooms/' + currentRoomId).update({
                decksGenerated: true,
                decks: { host: hostDeckData, guest: guestDeckData }
            });
        }
        if (data.decksGenerated) {
            db.ref('rooms/' + currentRoomId).off('value');
            document.getElementById('waiting-overlay').style.display = 'none';
            startOnlineGame('yellow', data.decks.host, data.decks.guest);
        }
    });
};

window.joinRoom = async function() {
    const inputId = document.getElementById('room-id-input').value.trim();
    if (!inputId) { alert("ルームIDを入力してください"); return; }
    
    try {
        const roomRef = db.ref('rooms/' + inputId);
        const snapshot = await roomRef.once('value');
        const roomData = snapshot.val();

        if (!roomData) {
            alert("部屋が見つかりません。IDを確認してください。");
            return;
        }

        if (roomData.status === 'waiting') {
            currentRoomId = inputId;
            isHost = false;
            await roomRef.update({ status: 'playing', guestDeckChoice: myDeckChoice });
            
            document.getElementById('room-select-overlay').style.display = 'none';
            document.getElementById('waiting-overlay').style.display = 'flex';
            document.getElementById('display-room-id').textContent = "ホストと接続中...";

            roomRef.on('value', (snap) => {
                const data = snap.val();
                if (data && data.decksGenerated) {
                    roomRef.off('value');
                    document.getElementById('waiting-overlay').style.display = 'none';
                    startOnlineGame('purple', data.decks.guest, data.decks.host);
                }
            });
        } else {
            alert("その部屋は既に対戦中です。");
        }
    } catch (e) {
        alert("通信エラー: Firebaseのルール設定が公開(true)になっているか確認してください。詳細: " + e.message);
    }
};

window.startOfflineGame = function(selectedDeck) {
    document.getElementById('app-container').style.display = 'flex';
    isOnlineMode = false;
    
    const isYouFirst = Math.random() < 0.5;
    myColor = isYouFirst ? 'yellow' : 'purple';
    opColor = isYouFirst ? 'purple' : 'yellow';
    
    const oppChoices = ['287期受験生', '幻影旅団'];
    const oppDeck = oppChoices[Math.floor(Math.random() * oppChoices.length)];
    
    masterDecks = {
        yellow: myColor === 'yellow' ? buildFixedDeck(selectedDeck) : buildFixedDeck(oppDeck),
        purple: myColor === 'purple' ? buildFixedDeck(selectedDeck) : buildFixedDeck(oppDeck)
    };
    
    initGameStateAndUI(myColor);
    startMulliganPhase();
};

window.startOnlineGame = function(assignedColor, myDeckData, oppDeckData) {
    document.getElementById('app-container').style.display = 'flex';
    isOnlineMode = true;
    myColor = assignedColor;
    opColor = myColor === 'yellow' ? 'purple' : 'yellow';
    
    masterDecks = {
        yellow: myColor === 'yellow' ? myDeckData : oppDeckData,
        purple: myColor === 'purple' ? myDeckData : oppDeckData
    };

    initGameStateAndUI(myColor);
    listenForOpponentMoves();
    startMulliganPhase();
};

function initGameStateAndUI(col) {
    const botBadge = document.getElementById('turn-badge-bottom');
    const topBadge = document.getElementById('turn-badge-top');
    botBadge.textContent = col === 'yellow' ? '先攻' : '後攻';
    topBadge.textContent = col === 'yellow' ? '後攻' : '先攻';
    botBadge.className = 'turn-badge ' + (col === 'yellow' ? 'badge-yellow' : 'badge-purple');
    topBadge.className = 'turn-badge ' + (col === 'yellow' ? 'badge-purple' : 'badge-yellow');

    handYellow = [null, null, null, null]; 
    handPurple = [null, null, null, null];
    discardYellow = []; discardPurple = [];
    activeEffects = [];
    hpYellow = 120; hpPurple = 120;
    
    playerGP = { yellow: { gp: {} }, purple: { gp: {} } };
    playerGP['purple'].gp['フリー'] = 1; // 後攻にフリーGP付与
    
    currentPlayer = 'yellow';
    boardData = new Array(36).fill(null);
    boardData[15] = { color: 'yellow', type: 'stone', name: '' };
    boardData[20] = { color: 'yellow', type: 'stone', name: '' };
    boardData[14] = { color: 'purple', type: 'stone', name: '' };
    boardData[21] = { color: 'purple', type: 'stone', name: '' };
}

function sendMoveToFirebase(moveType, dataPayload) {
    if (!isOnlineMode || !currentRoomId) return;
    try {
        db.ref('rooms/' + currentRoomId + '/moves').push({
            player: myColor,
            type: moveType,
            data: dataPayload,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    } catch(e) {}
}

function listenForOpponentMoves() {
    db.ref('rooms/' + currentRoomId + '/moves').on('child_added', async (snapshot) => {
        const move = snapshot.val();
        if (move.player === myColor) return; // 自分の送信は無視
        
        if (move.type === 'mulliganReady') {
            opMulliganReady = true;
            if (myMulliganReady) {
                document.getElementById('waiting-overlay').style.display = 'none';
                startTurn();
            }
        } else if (move.type === 'placeStone') {
            await placeStone(move.data.index, true, move.data, false);
        } else if (move.type === 'playAction') {
            await playActionCard(move.data.handIndex, true, move.data, false);
        } else if (move.type === 'passTurn') {
            checkGameOverAndChangeTurn();
        }
    });
}

function ensureCharacterInHand(player) {
    const hand = player === 'yellow' ? handYellow : handPurple;
    const deck = player === 'yellow' ? masterDecks.yellow : masterDecks.purple;
    
    let nonNulls = hand.filter(c => c !== null);
    let loopCount = 0;
    while (nonNulls.length > 0 && nonNulls.every(c => c.type === 'action') && deck.some(c => c.type === 'character')) {
        deck.push(...nonNulls);
        for(let i=0; i<4; i++) hand[i] = null;
        shuffleDeck(deck);
        for (let i = 0; i < 4; i++) {
            if (deck.length > 0) hand[i] = deck.pop();
        }
        nonNulls = hand.filter(c => c !== null);
        loopCount++;
        if(loopCount > 10) break;
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

// 安全にコストをチェックする関数（ハイライトバグ防止）
function checkCostStatus(card, playerColor) {
    if (!card || !card.cost) return 'OK'; 
    const pGP = playerGP[playerColor] ? playerGP[playerColor].gp : {};
    const availSpec = pGP[card.group] || 0;
    const totalGP = Object.values(pGP).reduce((sum, val) => sum + val, 0);
    const specReq = card.cost.specific || 0;
    const freeReq = card.cost.free || 0;
    if (availSpec >= specReq && totalGP >= (specReq + freeReq)) return 'OK';
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
        if (chars.length === 0) {
            logDisplay.textContent = '効果対象なし';
            await sleep(1000);
            return [];
        }
        if (chars.length === 1 && actingPlayer === myColor) {
            logDisplay.textContent = `自動選択: ${chars[0].name}`;
            await sleep(1000);
            return [chars[0]];
        }
        validCards = rawHand.filter(c => c !== null); 
    } else if (filterType === 'character') {
        validCards = validCards.filter(c => c.type === 'character');
    }

    if (validCards.length === 0) return [];
    if (filterType !== 'debuff' && validCards.length <= count) return [...validCards];

    if (actingPlayer !== myColor) {
        if (filterType === 'debuff') return rawHand.filter(c => c && c.type === 'character').sort(() => 0.5 - Math.random()).slice(0, count);
        return validCards.sort(() => 0.5 - Math.random()).slice(0, count);
    }

    window.isHandSelecting = true;
    document.getElementById('time-container').style.zIndex = '10001';

    return new Promise(resolve => {
        const overlay = document.getElementById('hand-select-overlay');
        const title = document.getElementById('hand-select-title');
        const grid = document.getElementById('hand-select-grid');
        const okBtn = document.getElementById('hand-select-ok-btn');

        title.textContent = message;
        grid.innerHTML = '';
        let selectedCards = [];

        window.autoSelectAndResolve = () => {
            let selectable = filterType === 'debuff' ? validCards.filter(c => c.type === 'character') : validCards;
            let autoSelected = selectable.sort(() => 0.5 - Math.random()).slice(0, count);
            closeHandSelection(overlay, resolve, autoSelected);
        };

        validCards.forEach(card => {
            const el = document.createElement('div');
            
            if (targetPlayer === myColor || filterType === 'debuff') {
                el.className = `hand-card card-${card.type}`;
                if (card.id) el.style.backgroundImage = `url('cards/${card.id}.png')`;
                
                let badgeClass = 'card-atk-badge';
                if (card.original_atk !== undefined) {
                    if (card.atk > card.original_atk) badgeClass += ' buffed';
                    if (card.atk < card.original_atk) badgeClass += ' debuffed';
                }
                
                let costHtml = `<div class="cost-container">${card.cost.specific > 0 ? `<div class="badge-specific">${card.cost.specific}</div>` : ''}${card.cost.free > 0 ? `<div class="badge-free">${card.cost.free}</div>` : ''}</div>`;
                
                el.innerHTML = `<div class="${badgeClass}"></div><div class="card-atk-text card-text-node">${card.type==='action'?'A':card.atk}</div><div class="card-rank card-text-node">${card.rank}</div><div class="card-name card-text-node">${card.name}</div>${costHtml}`;
            } else {
                el.className = card.type === 'character' ? 'hidden-char' : 'hidden-action';
            }

            if (filterType === 'debuff' && card.type === 'action') {
                el.style.opacity = '0.5';
                el.style.cursor = 'not-allowed';
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
    document.getElementById('time-container').style.zIndex = '5';
    resolve(selectedCards);
}

async function selectBoardTarget(validIndices) {
    window.isBoardTargeting = true;
    document.getElementById('time-container').style.zIndex = '10001';
    
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
            document.getElementById('time-container').style.zIndex = '5';
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

    el.className = className; if (card.id) el.style.backgroundImage = `url('cards/${card.id}.png')`;
    el.innerHTML = `<div class="${atkBadgeClass}"></div><div class="card-atk-text card-text-node">${card.type==='action'?'A':displayAtk}</div><div class="card-rank card-text-node">${card.rank}</div><div class="card-name card-text-node">${card.name}</div><div class="cost-container">${card.cost && card.cost.specific > 0 ? `<div class="badge-specific">${card.cost.specific}</div>` : ''}${card.cost && card.cost.free > 0 ? `<div class="badge-free">${card.cost.free}</div>` : ''}</div>`;
    return el;
}

// ハイライトを安全に描画
function updateHighlightsAndLines() {
    try {
        document.querySelectorAll('.highlight-box:not(.target-hl)').forEach(el => el.remove());
        svgGroup.innerHTML = ''; 
        
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

                if (triggers.length > 0) {
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
    } catch(e) {
        console.error("Highlight Error:", e);
    }
}

function renderHands() {
    const topArea = document.getElementById('hand-top'); const bottomArea = document.getElementById('hand-bottom');
    topArea.innerHTML = ''; bottomArea.innerHTML = '';
    
    (myColor === 'yellow' ? handYellow : handPurple).forEach((card, i) => {
        if (card === null) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'hand-card empty-slot';
            emptyEl.style.background = 'rgba(0,0,0,0.1)';
            emptyEl.style.border = '1px dashed #555';
            emptyEl.style.pointerEvents = 'none';
            bottomArea.appendChild(emptyEl);
            return;
        }
        const el = createCardElementUI(card, i, myColor);
        if (card.type === 'action' && currentPlayer === myColor && !actionUsedThisTurn) {
            el.onclick = () => playActionCard(i);
        } else if (card.type === 'character') {
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
            emptyEl.style.opacity = '0'; 
            emptyEl.style.pointerEvents = 'none';
            topArea.appendChild(emptyEl);
            return;
        }
        const el = document.createElement('div');
        el.className = card.type === 'character' ? 'hidden-char' : 'hidden-action';
        el.style.position = 'relative'; 
        
        if (card.type === 'character' && card.original_atk !== undefined) {
            let badge = document.createElement('div');
            badge.className = 'card-atk-badge';
            badge.style.top = 'auto'; 
            badge.style.bottom = '-5px';
            if (card.atk > card.original_atk) badge.classList.add('buffed');
            else if (card.atk < card.original_atk) badge.classList.add('debuffed');
            el.appendChild(badge);
        }
        topArea.appendChild(el);
    });
}

function updateBoardPerspective() {
    if (currentPlayer === myColor && window.selectedHandIndex != null) {
        boardContainer.classList.remove('tilted');
    } else if (currentPlayer === myColor && window.selectedHandIndex == null) {
         boardContainer.classList.remove('tilted'); 
    } else {
        boardContainer.classList.add('tilted'); 
    }
}

async function startMulliganPhase() {
    myMulliganReady = false;
    opMulliganReady = false;

    drawCards('yellow', 4); drawCards('purple', 4); updateHPUI();
    const overlay = document.getElementById('mulligan-overlay');
    const mulNodes = [ document.getElementById('mul-top'), document.getElementById('mul-left'), document.getElementById('mul-right'), document.getElementById('mul-bottom') ];
    let selectedForMulligan = [false, false, false, false];
    const myHand = myColor === 'yellow' ? handYellow : handPurple;
    myHand.forEach((card, i) => {
        const el = createCardElementUI(card, i, myColor, false);
        el.onclick = () => { selectedForMulligan[i] = !selectedForMulligan[i]; el.classList.toggle('mulligan-selected'); };
        mulNodes[i].innerHTML = ''; mulNodes[i].appendChild(el);
    });
    overlay.style.display = 'flex';
    
    document.getElementById('mulligan-ok-btn').onclick = () => {
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
            myMulliganReady = true;
            sendMoveToFirebase('mulliganReady', { ready: true });
            if (!opMulliganReady) {
                document.getElementById('waiting-overlay').style.display = 'flex';
                document.getElementById('display-room-id').textContent = "相手の準備を待っています...";
            } else {
                document.getElementById('waiting-overlay').style.display = 'none';
                startTurn();
            }
        } else {
            startTurn();
        }
    };
}

async function animateHandCard(card, playerColor, animClass) {
    if (!card) return;
    const hand = playerColor === 'yellow' ? handYellow : handPurple;
    const idx = hand.indexOf(card);
    if (idx > -1) {
        const containerId = playerColor === myColor ? 'hand-bottom' : 'hand-top';
        const el = document.getElementById(containerId).children[idx];
        if (el) el.classList.add(animClass);
    }
    await sleep(500);
}

// CPU用の自動対象抽出
function getCPUTargetData(card, handIndex, hand, oppHand) {
    let targetData = {};
    if (!card) return targetData;
    const id = card.id;
    if (id === "0004" || id === "0010" || id === "A199") {
        const valid = hand.map((c, i) => c !== null && i !== handIndex ? i : -1).filter(i => i !== -1);
        if (valid.length > 0) { targetData.discardHandIdx = valid[0]; targetData.discardCardData = hand[valid[0]]; }
    }
    else if (id === "0046" || id === "0048" || id === "A200") {
        const valid = hand.map((c, i) => c !== null && i !== handIndex ? i : -1).filter(i => i !== -1);
        if (valid.length > 0) targetData.returnHandIdx = valid[0];
    }
    else if (id === "0070") {
        const valid = oppHand.map((c, i) => c && c.type === 'character' ? i : -1).filter(i => i !== -1);
        if (valid.length > 0) targetData.debuffHandIdx = valid[0];
    }
    else if (id === "0002" || id === "0031" || id === "A043" || id === "A039") {
        const valid = hand.map((c, i) => c && c.type === 'character' && i !== handIndex ? i : -1).filter(i => i !== -1);
        if (valid.length > 0) targetData.buffHandIdx = valid[0];
    }
    else if (id === "0028" || id === "A044") {
        const chars = hand.map((c, i) => c && c.type === 'character' && i !== handIndex ? i : -1).filter(i => i !== -1);
        targetData.buffHandIndices = chars.sort(() => 0.5 - Math.random()).slice(0, 2);
    }
    else if (id === "A086") {
        const oppColor = currentPlayer === 'yellow' ? 'purple' : 'yellow';
        const oppCharIndices = [];
        boardData.forEach((c, idx) => { if (c && c.type === 'character' && c.color === oppColor) oppCharIndices.push(idx); });
        if (oppCharIndices.length > 0) targetData.targetBoardIdx = oppCharIndices[Math.floor(Math.random() * oppCharIndices.length)];
    }
    else if (id === "A087" || id === "A083") {
        const chars = oppHand.map((c, i) => c && (id==="A087" ? c.type === 'character' : (c.cost && (c.cost.specific + c.cost.free) <= 3)) ? i : -1).filter(i => i !== -1);
        if (chars.length > 0) {
            if (id==="A087") targetData.debuffHandIdx = chars[Math.floor(Math.random() * chars.length)];
            else targetData.discardHandIdx = chars[Math.floor(Math.random() * chars.length)];
        }
    }
    return targetData;
}

// 完全に安全化されたアクションカード処理
async function playActionCard(index, isFromNetwork = false, incomingTargetData = {}, isCPU = false) {
    const isHuman = !isFromNetwork && !isCPU;

    if (isHuman) {
        if (actionUsedThisTurn || window.isBoardSelecting || window.isBoardTargeting) return;
        if (currentPlayer !== myColor) return;
    }

    const hand = currentPlayer === 'yellow' ? handYellow : handPurple;
    if (isFromNetwork && incomingTargetData && incomingTargetData.cardData) {
        hand[index] = incomingTargetData.cardData; 
    }
    
    const card = hand[index];
    if (!card) return;

    if (isHuman) {
        if (checkCostStatus(card, currentPlayer) !== 'OK') return;
    }

    window.isBoardSelecting = true;
    
    try {
        const id = card.id;
        let targetData = isFromNetwork || isCPU ? (incomingTargetData.targets || incomingTargetData) : {};
        const opponentColor = currentPlayer === 'yellow' ? 'purple' : 'yellow';
        const oppHand = opponentColor === 'yellow' ? handYellow : handPurple;

        if (isHuman) {
            if (id === "A199") { 
                const targets = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '捨てるカードを選択してください', 'all');
                if(targets.length > 0) {
                    targetData.discardHandIdx = hand.indexOf(targets[0]);
                    targetData.discardCardData = targets[0];
                }
            } else if (id === "A043" || id === "A039") {
                const targets = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '強化するキャラを選択', 'character');
                if(targets.length > 0) targetData.buffHandIdx = hand.indexOf(targets[0]);
            } else if (id === "A044") {
                const chars = hand.map((c, i) => c && c.type === 'character' ? i : -1).filter(i => i !== -1);
                targetData.buffHandIndices = chars.sort(() => 0.5 - Math.random()).slice(0, 2);
            } else if (id === "A086") {
                const oppCharIndices = [];
                boardData.forEach((c, idx) => { if (c && c.type === 'character' && c.color === opponentColor) oppCharIndices.push(idx); });
                if (oppCharIndices.length > 0) {
                    logDisplay.textContent = '空にする相手のキャラを選択してください';
                    targetData.targetBoardIdx = await selectBoardTarget(oppCharIndices);
                }
            } else if (id === "A087") {
                const chars = oppHand.map((c, i) => c && c.type === 'character' ? i : -1).filter(i => i !== -1);
                if (chars.length > 0) targetData.debuffHandIdx = chars[Math.floor(Math.random() * chars.length)];
            } else if (id === "A083") {
                const valid = oppHand.map((c, i) => c && (c.cost && (c.cost.specific + c.cost.free) <= 3) ? i : -1).filter(i => i !== -1);
                if (valid.length > 0) targetData.discardHandIdx = valid[Math.floor(Math.random() * valid.length)];
            } else if (id === "A200") {
                const nonNulls = hand.map((c, i) => c !== null && i !== index ? i : -1).filter(i => i !== -1);
                if (nonNulls.length > 0) {
                    const targets = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, 'デッキに戻すカードを選択してください', 'all');
                    if (targets.length > 0) targetData.returnHandIdx = hand.indexOf(targets[0]);
                }
            }

            if (isOnlineMode) {
                try {
                    const cleanData = JSON.parse(JSON.stringify({ handIndex: index, cardData: card, targets: targetData }));
                    sendMoveToFirebase('playAction', cleanData);
                } catch(e) {}
            }
        }

        actionUsedThisTurn = true;
        let discarded = hand[index];
        hand[index] = null;
        if (currentPlayer === 'yellow') discardYellow.push(discarded); else discardPurple.push(discarded);
        logDisplay.textContent = `⚡アクション[${discarded.name}]使用！`; 
        renderHands();
        await sleep(300);

        if (id === "A043") {
            if(targetData.buffHandIdx !== undefined) hand[targetData.buffHandIdx].atk += 7;
        }
        else if (id === "A044") {
            if(targetData.buffHandIndices) targetData.buffHandIndices.forEach(i => hand[i].atk += 5);
        }
        else if (id === "A039") {
            if(targetData.buffHandIdx !== undefined) hand[targetData.buffHandIdx].atk += 3;
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
            }
        }
        else if (id === "A041") {
            if (currentPlayer === 'yellow') hpYellow += 7; else hpPurple += 7;
            await showDamageAnimation(`回復 7`, currentPlayer, 'heal');
        }
        else if (id === "A042") {
            const deck = currentPlayer === 'yellow' ? masterDecks.yellow : masterDecks.purple;
            deck.filter(c => c && c.type === 'character').forEach(c => c.atk += 2);
        }
        else if (id === "A152") {
            hand.filter(c => c && c.type === 'character').forEach(c => c.atk += 1);
        }
        else if (id === "A198") {
            const deck = currentPlayer === 'yellow' ? masterDecks.yellow : masterDecks.purple;
            deck.filter(c => c && c.type === 'character').forEach(c => c.atk += 1);
        }
        else if (id === "A199") {
            if(targetData.discardHandIdx !== undefined) {
                if ((isFromNetwork || isCPU) && targetData.discardCardData) hand[targetData.discardHandIdx] = targetData.discardCardData;
                const target = hand[targetData.discardHandIdx];
                if (target) {
                    await animateHandCard(target, currentPlayer, 'card-discard-anim');
                    hand[targetData.discardHandIdx] = null;
                    if (currentPlayer === 'yellow') discardYellow.push(target); else discardPurple.push(target);
                }
            }
        }
        else if (id === "A158") {
            drawCards(currentPlayer, 1); 
        }
        else if (id === "A087") {
            await animateGPFly(14, currentPlayer, '幻影旅団');
            playerGP[currentPlayer].gp['幻影旅団'] = (playerGP[currentPlayer].gp['幻影旅団'] || 0) + 1;
            if(targetData.debuffHandIdx !== undefined && oppHand[targetData.debuffHandIdx]) {
                const target = oppHand[targetData.debuffHandIdx];
                target.atk = Math.max(0, target.atk - 4);
                logDisplay.textContent = `相手の手札のATKを-4!`;
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
            });
            logDisplay.textContent = `相手の手札すべてのATKを-4!`;
            renderHands();
            await sleep(500);
        }
        else if (id === "A085") {
            if (currentPlayer === 'yellow') hpYellow += 10; else hpPurple += 10;
            await showDamageAnimation(`回復 10`, currentPlayer, 'heal');
        }
        else if (id === "A086") {
            if(targetData.targetBoardIdx !== undefined && targetData.targetBoardIdx !== -1) {
                boardData[targetData.targetBoardIdx] = { color: opponentColor, type: 'stone', name: '' };
                logDisplay.textContent = 'キャラを空のカードにしました';
                renderBoard();
                await sleep(500);
            } else {
                logDisplay.textContent = '効果対象なし';
                await sleep(1000);
            }
        }
        else if (id === "A083") {
            if(targetData.discardHandIdx !== undefined && oppHand[targetData.discardHandIdx]) {
                const target = oppHand[targetData.discardHandIdx];
                await animateHandCard(target, opponentColor, 'card-discard-anim');
                oppHand[targetData.discardHandIdx] = null;
                if (opponentColor === 'yellow') discardYellow.push(target); else discardPurple.push(target);
                logDisplay.textContent = `相手のカードを捨てさせた!`;
            } else {
                logDisplay.textContent = '効果対象なし';
                await sleep(1000);
            }
        }
        else if (id === "A163") {
            const deck = currentPlayer === 'yellow' ? masterDecks.yellow : masterDecks.purple;
            const targetIdx = deck.findIndex(c => c && c.type === 'character' && (c.cost && (c.cost.specific + c.cost.free) >= 3));
            if (targetIdx !== -1) {
                const drawn = deck.splice(targetIdx, 1)[0];
                const emptyIdx = hand.indexOf(null);
                if (emptyIdx !== -1) hand[emptyIdx] = drawn;
                else deck.push(drawn);
                logDisplay.textContent = 'キャラを引いた!';
            } else {
                logDisplay.textContent = '効果対象なし';
            }
            await sleep(1000);
        }
        else if (id === "A200") {
            if(targetData.returnHandIdx !== undefined && hand[targetData.returnHandIdx]) {
                const target = hand[targetData.returnHandIdx];
                await animateHandCard(target, currentPlayer, 'card-return-anim');
                hand[targetData.returnHandIdx] = null;
                const deck = currentPlayer === 'yellow' ? masterDecks.yellow : masterDecks.purple;
                deck.push(target);
                shuffleDeck(deck);
            }
        }
        else if (id === "A201") {
            drawCards(currentPlayer, 1);
        }
        
        updateHPUI(); renderHands(); updateHighlightsAndLines();
        
    } catch (e) {
        console.error("Action Card Error:", e);
    } finally {
        window.isBoardSelecting = false;
    }
}

// ====== カード配置処理（ダブルチェック防止の完全対応版） ======
async function placeStone(index, isFromNetwork = false, incomingData = {}, isCPU = false) {
    const isHuman = !isFromNetwork && !isCPU;

    if (isHuman) {
        if (currentPlayer !== myColor) return; 
        if (window.isBoardSelecting || window.isBoardTargeting || window.selectedHandIndex == null) return;
        if (getFlippableAndTriggers(index, currentPlayer).flippable.length === 0) return;
    }
    
    window.isBoardSelecting = true;

    try {
        const handIndex = isHuman ? window.selectedHandIndex : incomingData.handIndex;
        const hand = currentPlayer === 'yellow' ? handYellow : handPurple;
        
        if (isFromNetwork && incomingData.cardData) {
            hand[handIndex] = incomingData.cardData; 
        }
        
        const selectedCard = hand[handIndex];
        if (!selectedCard) return;

        let targetData = isHuman ? {} : (incomingData.targets || {});

        if (isHuman) {
            const costStatus = checkCostStatus(selectedCard, currentPlayer);
            let triggerMet = checkAbilityMet(selectedCard, index, getFlippableAndTriggers(index, currentPlayer).flippable, currentPlayer);
            
            if (costStatus === 'OK' && triggerMet) {
                const oppColor = currentPlayer === 'yellow' ? 'purple' : 'yellow';
                if (selectedCard.id === "0004" || selectedCard.id === "0010") {
                    const targets = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '捨てるカードを選択してください', 'all');
                    if(targets.length > 0) {
                        targetData.discardHandIdx = hand.indexOf(targets[0]);
                        targetData.discardCardData = targets[0];
                    }
                }
                else if (selectedCard.id === "0046" || selectedCard.id === "0048") {
                    const targets = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, 'デッキに戻すカードを選択してください', 'all');
                    if(targets.length > 0) targetData.returnHandIdx = hand.indexOf(targets[0]);
                }
                else if (selectedCard.id === "0070") {
                    const oppHand = oppColor === 'yellow' ? handYellow : handPurple;
                    const targets = await selectHandCardsTarget(currentPlayer, oppColor, 1, 'ATKを下げる相手の手札を選択', 'debuff');
                    if(targets.length > 0) targetData.debuffHandIdx = oppHand.indexOf(targets[0]);
                }
                else if (selectedCard.id === "0002" || selectedCard.id === "0031") {
                    hand[handIndex] = null; 
                    const targets = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '強化するキャラを選択', 'character');
                    hand[handIndex] = selectedCard; 
                    if(targets.length > 0) targetData.buffHandIdx = hand.indexOf(targets[0]);
                }
                else if (selectedCard.id === "0028") {
                    const chars = hand.map((c, i) => c && c.type === 'character' && i !== handIndex ? i : -1).filter(i => i !== -1);
                    targetData.buffHandIndices = chars.sort(() => 0.5 - Math.random()).slice(0, 2);
                }
            }
            
            if (isOnlineMode) {
                try {
                    const cleanData = JSON.parse(JSON.stringify({ index: index, handIndex: handIndex, cardData: selectedCard, targets: targetData }));
                    sendMoveToFirebase('placeStone', cleanData);
                } catch(e) {}
            }
        }

        hand[handIndex] = null;
        if (isHuman) window.selectedHandIndex = null;
        
        boardContainer.classList.add('tilted');
        document.querySelectorAll('.highlight-box').forEach(el => el.remove());
        svgGroup.innerHTML = '';

        await executeCombat(index, currentPlayer, selectedCard, targetData);

    } catch (e) {
        console.error("PlaceStone Error:", e);
    } finally {
        window.isBoardSelecting = false;
        // バトルと配置が確実に終わった後に、ターンを「1回だけ」回す
        checkGameOverAndChangeTurn();
    }
}

async function executeCombat(index, playerColor, selectedCard, targetData = {}) {
    try {
        const result = getFlippableAndTriggers(index, playerColor);
        const costStatus = checkCostStatus(selectedCard, playerColor);
        const opponentColor = playerColor === 'yellow' ? 'purple' : 'yellow';
        let triggerMet = checkAbilityMet(selectedCard, index, result.flippable, playerColor);
        
        let finalCard = { ...selectedCard, color: playerColor };
        
        if (costStatus !== 'OK' || !triggerMet) {
            finalCard.combo = null; finalCard.ability = null; result.triggers = [];
            let orig = selectedCard.original_atk !== undefined ? selectedCard.original_atk : selectedCard.atk;
            let buffAmount = selectedCard.atk - orig;
            if (isNaN(buffAmount)) buffAmount = 0;
            finalCard.atk = Math.max(0, 1 + buffAmount); 
        }
        
        boardData[index] = finalCard;
        renderBoard();
        await sleep(500); 

        result.flippable.forEach(idx => {
            const tc = boardData[idx];
            if (tc && tc.type === 'character') { 
                if (tc.color === 'yellow') discardYellow.push(tc); 
                else discardPurple.push(tc); 
            }
            boardData[idx] = { color: playerColor, type: 'stone', name: '' };
        });
        renderBoard();
        await sleep(400);
        
        const targetPlayer = playerColor === 'yellow' ? 'purple' : 'yellow';

        let baseAtk = finalCard.atk;
        let flipBonus = result.flippable.length >= 2 ? (result.flippable.length * 2 - 3) : 0;
        
        const popup = document.createElement('div');
        popup.className = 'damage-popup normal';
        document.getElementById('app-container').appendChild(popup);
        await sleep(50); popup.textContent = baseAtk; popup.classList.add('show'); await sleep(600);

        let totalNormalDamage = baseAtk;
        if (flipBonus > 0) {
            popup.textContent = `${baseAtk} + ${flipBonus}`;
            await sleep(600);
            totalNormalDamage = baseAtk + flipBonus;
            popup.textContent = totalNormalDamage;
            await sleep(500);
        }

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
        popup.remove();
        await sleep(200);

        if (hpYellow <= 0 || hpPurple <= 0) return;

        let abilityDamage = 0;
        if (finalCard.ability && finalCard.ability.text && triggerMet) {
            const text = finalCard.ability.text;
            const sMatch = text.match(/特殊ダメージを(\d+)/);
            const nMatch = text.match(/念ダメージを(\d+)/);
            if (sMatch) abilityDamage += parseInt(sMatch[1]);
            if (nMatch) abilityDamage += parseInt(nMatch[1]);

            if (finalCard.id === "0003") activeEffects.push({ player: playerColor, type: 'buff_random', amount: 2, turnsLeft: 3 });
            if (finalCard.id === "0131") activeEffects.push({ player: playerColor, type: 'reduce_damage_taken', amount: 10, turnsLeft: 1 });
            
            const hMatch = text.match(/HPを(\d+)回復/);
            if (hMatch && result.flippable.length >= 2) {
                const heal = parseInt(hMatch[1]);
                logDisplay.textContent = `⚡能力発動！`;
                await showDamageAnimation(`回復 ${heal}`, playerColor, 'heal');
                if (playerColor === 'yellow') hpYellow += heal; else hpPurple += heal;
                updateHPUI();
            }

            if (finalCard.id === "0064") {
                const oppHand = playerColor === 'yellow' ? handPurple : handYellow;
                oppHand.filter(c => c && c.type === 'character').forEach(c => { c.atk = Math.max(0, c.atk - 3); });
                logDisplay.textContent = `⚡相手の手札をデバフ！`;
                renderHands();
            }

            if (finalCard.id === "0066") {
                activeEffects.push({ player: playerColor, type: 'reduce_damage_all', amount: 2, turnsLeft: 3, index: index, cardId: finalCard.id });
            }
            if (finalCard.id === "0060") {
                activeEffects.push({ player: playerColor, type: 'reduce_damage_normal', amount: 4, turnsLeft: 4, index: index, cardId: finalCard.id });
            }
        }
        
        if (abilityDamage > 0) {
            logDisplay.textContent = `⚡能力発動！`;
            let { finalDamage: aFinalDmg, reduction: aRed } = applyDamageReduction(abilityDamage, 'special', targetPlayer);
            if (aRed > 0) {
                await showDamageAnimationReduction(aRed, aFinalDmg, targetPlayer);
            } else {
                await showDamageAnimation(`能力 ${aFinalDmg}`, targetPlayer);
            }
            if (playerColor === 'yellow') hpPurple -= aFinalDmg; else hpYellow -= aFinalDmg;
            updateHPUI();
            await sleep(200);
            if (hpYellow <= 0 || hpPurple <= 0) return; 
        }

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
                    if (cRed > 0) {
                        await showDamageAnimationReduction(cRed, cFinalDmg, targetPlayer);
                    } else {
                        await showDamageAnimation(`コンボ ${cFinalDmg}`, targetPlayer);
                    }
                    if (playerColor === 'yellow') hpPurple -= cFinalDmg; else hpYellow -= cFinalDmg;
                    updateHPUI();
                    await sleep(300);
                    if (hpYellow <= 0 || hpPurple <= 0) return; 
                }
                if (comboHeal > 0) {
                    logDisplay.textContent = `🔗[${bCard.name}]コンボ発動！`;
                    await showDamageAnimation(`回復 ${comboHeal}`, playerColor, 'heal');
                    if (playerColor === 'yellow') hpYellow += comboHeal; else hpPurple += comboHeal;
                    updateHPUI();
                    await sleep(300);
                }
            }
        }

        const activeHand = playerColor === 'yellow' ? handYellow : handPurple;
        
        if (targetData.discardHandIdx !== undefined && activeHand[targetData.discardHandIdx]) {
            if (targetData.discardCardData) activeHand[targetData.discardHandIdx] = targetData.discardCardData;
            const c = activeHand[targetData.discardHandIdx];
            await animateHandCard(c, playerColor, 'card-discard-anim');
            activeHand[targetData.discardHandIdx] = null;
            if (playerColor === 'yellow') discardYellow.push(c); else discardPurple.push(c);
        }
        if (targetData.returnHandIdx !== undefined && activeHand[targetData.returnHandIdx]) {
            const c = activeHand[targetData.returnHandIdx];
            await animateHandCard(c, playerColor, 'card-return-anim');
            activeHand[targetData.returnHandIdx] = null;
            const deck = playerColor === 'yellow' ? masterDecks.yellow : masterDecks.purple;
            deck.push(c); shuffleDeck(deck);
        }
        if (targetData.debuffHandIdx !== undefined) {
            const oppHand = playerColor === 'yellow' ? handPurple : handYellow;
            if(oppHand[targetData.debuffHandIdx]) oppHand[targetData.debuffHandIdx].atk = Math.max(0, oppHand[targetData.debuffHandIdx].atk - 10);
        }
        if (targetData.buffHandIdx !== undefined && activeHand[targetData.buffHandIdx]) {
            if (finalCard.id === "0002") activeHand[targetData.buffHandIdx].atk += 3;
            if (finalCard.id === "0031") activeHand[targetData.buffHandIdx].atk += 5;
        }
        if (targetData.buffHandIndices) {
            targetData.buffHandIndices.forEach(i => { if(activeHand[i]) activeHand[i].atk += 5; });
        }

        if (Object.keys(targetData).length > 0) {
            renderHands();
            await sleep(300);
        }

        await animateGPFly(index, playerColor, finalCard.group);
        playerGP[playerColor].gp[finalCard.group] = (playerGP[playerColor].gp[finalCard.group] || 0) + 1;
        
        if (triggerMet && finalCard.id === "0073") {
            await animateGPFly(index, playerColor, '幻影旅団');
            playerGP[playerColor].gp['幻影旅団'] = (playerGP[playerColor].gp['幻影旅団'] || 0) + 1;
        }

        logDisplay.textContent = ``;
        renderHands();
    } catch (e) {
        console.error("戦闘処理エラー:", e);
    }
}

function checkGameOverAndChangeTurn() {
    window.selectedHandIndex = null; 
    clearInterval(timerId); 
    if (hpYellow <= 0 || hpPurple <= 0 || !boardData.includes(null)) { setTimeout(() => alert(`ゲーム終了！`), 100); return; }
    currentPlayer = currentPlayer === 'yellow' ? 'purple' : 'yellow'; 
    startTurn();
}

function startTurn() {
    actionUsedThisTurn = false; 
    usedThinkThisTurn = false;
    window.selectedHandIndex = null; 
    updateBoardPerspective(); 
    
    activeEffects.forEach(effect => {
        if (effect.player !== currentPlayer) {
            if (effect.turnsLeft > 0) effect.turnsLeft--;
        }
        if (effect.player === currentPlayer && effect.turnsLeft > 0) {
            if (effect.type === 'buff_random') {
                const hand = currentPlayer === 'yellow' ? handYellow : handPurple;
                const chars = hand.filter(c => c && c.type === 'character');
                if (chars.length > 0) {
                    const target = chars[Math.floor(Math.random() * chars.length)];
                    target.atk += effect.amount;
                }
            }
        }
    });
    
    drawCards(currentPlayer, 4); updateHPUI();
    document.querySelectorAll('.highlight-box').forEach(el => el.remove()); svgGroup.innerHTML = '';
    
    clearInterval(timerId); timeLeft = 30; timeLeftDisplay.textContent = timeLeft;
    const isMe = currentPlayer === myColor; 
    logDisplay.textContent = ""; 
    renderBoard(); renderHands();
    
    if (!isMe) { 
        if (!isOnlineMode) {
            setTimeout(autoPlayOpponent, 1500); 
        }
        return; 
    }

    timerId = setInterval(async () => { 
        timeLeft--; timeLeftDisplay.textContent = timeLeft; 
        if (timeLeft <= 0) {
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

async function autoPlayTimeout() {
    logDisplay.textContent = "時間切れ！自動で配置します。";
    window.isBoardSelecting = true;
    try {
        const hand = currentPlayer === 'yellow' ? handYellow : handPurple;
        const oppHand = currentPlayer === 'yellow' ? handPurple : handYellow;
        const chars = hand.filter(c => c && c.type === 'character');
        
        if (chars.length > 0) {
            for(let c of chars) {
                let validMoves = [];
                for (let i = 0; i < 36; i++) {
                    if (getFlippableAndTriggers(i, currentPlayer).flippable.length > 0) validMoves.push(i);
                }
                if (validMoves.length > 0) {
                    let moveIndex = validMoves[Math.floor(Math.random() * validMoves.length)];
                    let handIndex = hand.indexOf(c);
                    let targetData = getCPUTargetData(c, handIndex, hand, oppHand);
                    
                    await placeStone(moveIndex, false, { handIndex: handIndex, targets: targetData, cardData: c }, true);
                    return;
                }
            }
        }
        logDisplay.textContent = "配置可能キャラなし！パスします。";
        
        if (isOnlineMode) {
            try { sendMoveToFirebase('passTurn', {}); } catch(e){}
        }
        checkGameOverAndChangeTurn();
    } catch (e) {
        checkGameOverAndChangeTurn();
    }
}

async function autoPlayOpponent() {
    try {
        const hand = opColor === 'yellow' ? handYellow : handPurple;
        const oppHand = opColor === 'yellow' ? handPurple : handYellow;
        
        const validActions = hand.filter(c => c && c.type === 'action' && checkCostStatus(c, opColor) === 'OK');
        if (!actionUsedThisTurn && validActions.length > 0 && Math.random() > 0.5) {
            const actionCard = validActions[Math.floor(Math.random() * validActions.length)];
            const index = hand.indexOf(actionCard);
            let targetData = getCPUTargetData(actionCard, index, hand, oppHand);
            await playActionCard(index, false, { targets: targetData, cardData: actionCard }, true); 
            await sleep(1000);
        }

        const validMoves = [];
        for (let i = 0; i < 36; i++) if (getFlippableAndTriggers(i, currentPlayer).flippable.length > 0) validMoves.push(i);
        const chars = hand.filter(c => c && c.type === 'character');
        
        if (validMoves.length > 0 && chars.length > 0) {
            const randChar = chars[Math.floor(Math.random() * chars.length)];
            const handIndex = hand.indexOf(randChar);
            const moveIndex = validMoves[Math.floor(Math.random() * validMoves.length)];
            let targetData = getCPUTargetData(randChar, handIndex, hand, oppHand);
            
            await placeStone(moveIndex, false, { handIndex: handIndex, targets: targetData, cardData: randChar }, true);
        } else {
            checkGameOverAndChangeTurn();
        }
    } catch(e) {
        checkGameOverAndChangeTurn();
    }
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

        if (boardData[i] !== null) {
            const stone = document.createElement('div'); stone.classList.add('stone', boardData[i].color);
            if (boardData[i].type === 'stone') stone.classList.add('card-stone');
            else { 
                stone.classList.add(`card-${boardData[i].type}`); 
                if (boardData[i].id) stone.style.backgroundImage = `url('cards/${boardData[i].id}.png')`; 
                stone.innerHTML = `<div class="card-name card-text-node">${boardData[i].name || ''}</div>`; 
            }
            if(hasGlow) stone.classList.add('active-buff-glow');
            cell.appendChild(stone);
        } else if (hasGlow) {
            cell.classList.add('active-buff-glow'); 
        }
        
        cell.addEventListener('click', () => placeStone(i)); boardElement.appendChild(cell);
    }
    updateHighlightsAndLines();
}

window.useTimeExtension = function() {
    if (currentPlayer === myColor && !usedThinkThisTurn && timeExtendCountMy > 0 && timerId !== null) {
        usedThinkThisTurn = true;
        timeExtendCountMy--;
        document.getElementById(`td-bottom-${3 - timeExtendCountMy}`).classList.add('used');
        timeLeft += 30; timeLeftDisplay.textContent = timeLeft;
        logDisplay.textContent = `⏳長考(+30秒)を使用！`;
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

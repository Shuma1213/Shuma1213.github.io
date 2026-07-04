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

let playerGP = { yellow: { gp: {} }, purple: { gp: {} } };
let discardYellow = []; let discardPurple = [];
let handYellow = [null, null, null, null]; 
let handPurple = [null, null, null, null];
let masterDecks = {};
let activeEffects = []; 

let timeExtendCountMy = 3; 
window.opTimeExtend = 3; 

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// ====== デッキビルド・シャッフル ======
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

// ====== モード選択 ======
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

// ==========================================
// オンライン対戦：ルーム管理機能
// ==========================================
window.createRoom = function() {
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
    const roomId = document.getElementById('room-id-input').value.trim();
    if (!roomId) { alert("ルームIDを入力してください"); return; }

    const roomRef = db.ref('rooms/' + roomId);
    roomRef.once('value', (snap) => {
        const data = snap.val();
        if (data && data.status === 'waiting') {
            document.getElementById('room-select-overlay').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
            
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

// ====== 確実なFirebase同期関数（JSON変換で配列消失を防止） ======
function pushGameStateToFirebase(nextPlayer = null) {
    if (!isOnlineMode) return;
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
        discardPurpleJSON: JSON.stringify(discardPurple)
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
    
    playerGP = { yellow: { gp: {} }, purple: { gp: {} } };
    playerGP['purple'].gp['フリー'] = 1; 
    currentPlayer = 'yellow';
    timeExtendCountMy = 3;
    window.opTimeExtend = 3;
    
    boardData = new Array(36).fill(null);
    boardData[15] = { color: 'yellow', type: 'stone', name: '' };
    boardData[20] = { color: 'yellow', type: 'stone', name: '' };
    boardData[14] = { color: 'purple', type: 'stone', name: '' };
    boardData[21] = { color: 'purple', type: 'stone', name: '' };

    const roomRef = db.ref('rooms/' + currentRoomId);
    
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data || data.status === 'waiting') return;

        // JSONで安全に復元
        if (data.boardDataJSON) boardData = JSON.parse(data.boardDataJSON);
        if (data.handYellowJSON) handYellow = JSON.parse(data.handYellowJSON);
        if (data.handPurpleJSON) handPurple = JSON.parse(data.handPurpleJSON);
        if (data.discardYellowJSON) discardYellow = JSON.parse(data.discardYellowJSON);
        if (data.discardPurpleJSON) discardPurple = JSON.parse(data.discardPurpleJSON);
        if (data.playerGPJSON) playerGP = JSON.parse(data.playerGPJSON);

        if (data.hpYellow !== undefined) hpYellow = data.hpYellow;
        if (data.hpPurple !== undefined) hpPurple = data.hpPurple;
        
        const myCount = myColor === 'yellow' ? data.timeExtendCountYellow : data.timeExtendCountPurple;
        const opCount = opColor === 'yellow' ? data.timeExtendCountYellow : data.timeExtendCountPurple;
        if (myCount !== undefined) timeExtendCountMy = myCount;
        if (opCount !== undefined) window.opTimeExtend = opCount;

        updateHPUI();
        
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

        renderBoard();
        renderHands();
        
        // ターン管理
        if (data.currentPlayer && data.currentPlayer !== currentPlayer) {
            currentPlayer = data.currentPlayer;
            if (currentPlayer === myColor) {
                startTurn(); 
            } else {
                logDisplay.textContent = "相手のターンです...";
            }
        }
    });

    startMulliganPhase(); 
}

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
    playerGP[isYouFirst ? opColor : myColor].gp['フリー'] = 1;
    currentPlayer = 'yellow';
    timeExtendCountMy = 3;
    window.opTimeExtend = 3;
    
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
    el.innerHTML = `<div class="${atkBadgeClass}"></div><div class="card-atk-text card-text-node">${card.type==='action'?'A':displayAtk}</div><div class="card-rank card-text-node">${card.rank}</div><div class="card-name card-text-node">${card.name}</div><div class="cost-container">${card.cost.specific > 0 ? `<div class="badge-specific">${card.cost.specific}</div>` : ''}${card.cost.free > 0 ? `<div class="badge-free">${card.cost.free}</div>` : ''}</div>`;
    return el;
}

function updateHighlightsAndLines() {
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
    if (currentPlayer === myColor && window.selectedHandIndex != null) {
        boardContainer.classList.remove('tilted');
    } else if (currentPlayer === myColor && window.selectedHandIndex == null) {
         boardContainer.classList.remove('tilted'); 
    } else {
        boardContainer.classList.add('tilted'); 
    }
}

async function startMulliganPhase() {
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
            // お互いが自分のマリガン結果だけをFirebaseに送信する
            const updates = {};
            if (myColor === 'yellow') updates.handYellowJSON = JSON.stringify(handYellow);
            else updates.handPurpleJSON = JSON.stringify(handPurple);
            db.ref('rooms/' + currentRoomId).update(updates);

            if (currentPlayer === myColor) {
                startTurn();
            } else {
                logDisplay.textContent = "相手のターンです...";
                renderHands();
            }
        } else {
            startTurn();
        }
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
    
    if (id === "A199") { 
        preSelectedCards = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '捨てるカードを選択してください', 'all');
    }
    
    actionUsedThisTurn = true;
    let discarded = hand[index];
    hand[index] = null;
    if (currentPlayer === 'yellow') discardYellow.push(discarded); else discardPurple.push(discarded);
    logDisplay.textContent = `⚡アクション[${discarded.name}]使用！`; 
    renderHands();
    await sleep(300);

    if (id === "A043") {
        const targets = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '強化するキャラを選択', 'character');
        targets.forEach(c => c.atk += 7);
    }
    else if (id === "A044") {
        const chars = hand.filter(c => c && c.type === 'character');
        const targets = chars.sort(() => 0.5 - Math.random()).slice(0, 2);
        targets.forEach(c => c.atk += 5);
    }
    else if (id === "A039") {
        const targets = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '強化するキャラを選択', 'character');
        targets.forEach(c => c.atk += 3);
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
        for (let c of preSelectedCards) {
            await animateHandCard(c, currentPlayer, 'card-discard-anim');
            hand[hand.indexOf(c)] = null;
            if (currentPlayer === 'yellow') discardYellow.push(c); else discardPurple.push(c);
        }
    }
    else if (id === "A158") {
        drawCards(currentPlayer, 1); 
    }
    else if (id === "A087") {
        await animateGPFly(14, currentPlayer, '幻影旅団');
        playerGP[currentPlayer].gp['幻影旅団'] = (playerGP[currentPlayer].gp['幻影旅団'] || 0) + 1;
        const oppHand = currentPlayer === 'yellow' ? handPurple : handYellow;
        const chars = oppHand.filter(c => c && c.type === 'character');
        if (chars.length > 0) {
            const target = chars[Math.floor(Math.random() * chars.length)];
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
        const oppHand = currentPlayer === 'yellow' ? handPurple : handYellow;
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
        const oppCharIndices = [];
        boardData.forEach((c, idx) => { if (c && c.type === 'character' && c.color === opColor) oppCharIndices.push(idx); });
        
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
                boardData[targetIdx] = { color: opColor, type: 'stone', name: '' };
                logDisplay.textContent = 'キャラを空のカードにしました';
                renderBoard();
                await sleep(500);
            }
        }
    }
    else if (id === "A083") {
        const oppHand = currentPlayer === 'yellow' ? handPurple : handYellow;
        const validTargets = oppHand.filter(c => c && (c.cost.specific + c.cost.free) <= 3);
        if (validTargets.length === 0) {
            logDisplay.textContent = '効果対象なし';
            await sleep(1000);
        } else {
            const target = validTargets[Math.floor(Math.random() * validTargets.length)];
            await animateHandCard(target, opColor, 'card-discard-anim');
            oppHand[oppHand.indexOf(target)] = null;
            if (opColor === 'yellow') discardYellow.push(target); else discardPurple.push(target);
            logDisplay.textContent = `相手のカードを捨てさせた!`;
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
            }
        }
    }
    else if (id === "A201") {
        drawCards(currentPlayer, 1);
    }
    
    updateHPUI(); renderHands(); updateHighlightsAndLines();
    window.isBoardSelecting = false;
    
    if (hpYellow <= 0 || hpPurple <= 0) { checkGameOverAndChangeTurn(); return; }
    
    if (isOnlineMode) pushGameStateToFirebase();
    if (timeLeft <= 0) autoPlayTimeout();
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

async function showDamageAnimation(damageText, targetPlayer, colorClass = 'normal') {
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

async function showDamageAnimationReduction(reduction, finalDmg, targetPlayer) {
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

async function animateGPFly(startIndex, playerColor, group) {
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

// ====== 戦闘・ダメージ計算（めくりと効果適用） ======
async function executeCombat(index, playerColor, finalCard, result) {
    const targetPlayer = playerColor === 'yellow' ? 'purple' : 'yellow';

    // ひっくり返す処理
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

    if (hpYellow <= 0 || hpPurple <= 0) return true; 

    // 能力ダメージ・回復
    let abilityDamage = 0;
    if (finalCard.ability && finalCard.ability.text) {
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

        if (finalCard.id === "0066") activeEffects.push({ player: playerColor, type: 'reduce_damage_all', amount: 2, turnsLeft: 3, index: index, cardId: finalCard.id });
        if (finalCard.id === "0060") activeEffects.push({ player: playerColor, type: 'reduce_damage_normal', amount: 4, turnsLeft: 4, index: index, cardId: finalCard.id });
    }
    
    if (abilityDamage > 0) {
        logDisplay.textContent = `⚡能力発動！`;
        let { finalDamage: aFinalDmg, reduction: aRed } = applyDamageReduction(abilityDamage, 'special', targetPlayer);
        if (aRed > 0) await showDamageAnimationReduction(aRed, aFinalDmg, targetPlayer);
        else await showDamageAnimation(`能力 ${aFinalDmg}`, targetPlayer);
        
        if (playerColor === 'yellow') hpPurple -= aFinalDmg; else hpYellow -= aFinalDmg;
        updateHPUI();
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
                await sleep(300);
                if (hpYellow <= 0 || hpPurple <= 0) return true;
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

    // GPフライエフェクト
    await animateGPFly(index, playerColor, finalCard.group);
    playerGP[playerColor].gp[finalCard.group] = (playerGP[playerColor].gp[finalCard.group] || 0) + 1;
    if (finalCard.ability && finalCard.id === "0073") {
        await animateGPFly(index, playerColor, '幻影旅団');
        playerGP[playerColor].gp['幻影旅団'] = (playerGP[playerColor].gp['幻影旅団'] || 0) + 1;
    }

    logDisplay.textContent = ``;
    renderHands();
    return false;
}

// ====== 盤面への石置きメイン関数（手順の徹底＋AIフリーズ対応） ======
async function placeStone(index) {
    if (window.isBoardSelecting || window.isBoardTargeting || window.selectedHandIndex == null) return;
    const result = getFlippableAndTriggers(index, currentPlayer);
    if (result.flippable.length === 0) return;
    
    const hand = currentPlayer === 'yellow' ? handYellow : handPurple;
    const selectedCard = hand[window.selectedHandIndex];
    if (!selectedCard) return;

    window.isBoardSelecting = true;
    
    // 【手順1】手札からカードを取り除き、UIを更新
    hand[window.selectedHandIndex] = null;
    window.selectedHandIndex = null;
    boardContainer.classList.remove('tilted');
    document.querySelectorAll('.highlight-box').forEach(el => el.remove());
    if (svgGroup) svgGroup.innerHTML = '';
    renderHands();

    try {
        const opponentColor = currentPlayer === 'yellow' ? 'purple' : 'yellow';
        const costStatus = checkCostStatus(selectedCard, currentPlayer);
        let triggerMet = checkAbilityMet(selectedCard, index, result.flippable, currentPlayer);
        
        let finalCard = { ...selectedCard, color: currentPlayer };
        
        // コスト不足や条件未達ならバニラ化
        if (costStatus !== 'OK' || !triggerMet) {
            finalCard.combo = null; finalCard.ability = null; result.triggers = [];
            let orig = selectedCard.original_atk !== undefined ? selectedCard.original_atk : selectedCard.atk;
            let buffAmount = selectedCard.atk - orig;
            if (isNaN(buffAmount)) buffAmount = 0;
            finalCard.atk = Math.max(0, 1 + buffAmount); 
        }

        // 【手順2】まずは盤面にカードを置く（まだめくらない）
        boardData[index] = finalCard;
        renderBoard();
        
        // 【手順3】1呼吸おく
        await sleep(500);

        // 【手順4】発動条件を満たしている場合、バフ・デバフ・捨てる対象を選択
        let discardList = []; let returnList = []; let debuffList = []; let buffTargets = [];

        if (costStatus === 'OK' && triggerMet) {
            if (finalCard.id === "0004" || finalCard.id === "0010") {
                discardList = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '捨てるカードを選択してください', 'all');
            }
            if (finalCard.id === "0046" || finalCard.id === "0048") {
                returnList = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, 'デッキに戻すカードを選択してください', 'all');
            }
            if (finalCard.id === "0070") {
                debuffList = await selectHandCardsTarget(currentPlayer, opponentColor, 1, 'ATKを下げる相手の手札を選択', 'debuff');
            }
            if (finalCard.id === "0002" || finalCard.id === "0031") {
                buffTargets = await selectHandCardsTarget(currentPlayer, currentPlayer, 1, '強化するキャラを選択', 'character');
            }
            if (finalCard.id === "0028") {
                const activeHand = currentPlayer === 'yellow' ? handYellow : handPurple;
                const chars = activeHand.filter(c => c && c.type === 'character');
                buffTargets = chars.sort(() => 0.5 - Math.random()).slice(0, 2);
            }
        }

        // 【手順5】選択された効果を適用
        const activeHand = currentPlayer === 'yellow' ? handYellow : handPurple;
        for (let c of discardList) {
            await animateHandCard(c, currentPlayer, 'card-discard-anim');
            activeHand[activeHand.indexOf(c)] = null;
            if (currentPlayer === 'yellow') discardYellow.push(c); else discardPurple.push(c);
        }
        for (let c of returnList) {
            await animateHandCard(c, currentPlayer, 'card-return-anim');
            activeHand[activeHand.indexOf(c)] = null;
            const deck = currentPlayer === 'yellow' ? masterDecks.yellow : masterDecks.purple;
            deck.push(c); shuffleDeck(deck);
        }
        for (let c of debuffList) { c.atk = Math.max(0, c.atk - 10); }
        for (let c of buffTargets) {
            if (finalCard.id === "0002") c.atk += 3;
            if (finalCard.id === "0031" || finalCard.id === "0028") c.atk += 5;
        }

        if (discardList.length > 0 || returnList.length > 0 || debuffList.length > 0 || buffTargets.length > 0) {
            renderHands();
            await sleep(300);
        }

        // 【手順6】いよいよめくって戦闘ダメージを計算
        await executeCombat(index, currentPlayer, finalCard, result);

    } catch (error) {
        console.error("戦闘処理中にエラーが発生しました:", error);
    } finally {
        window.isBoardSelecting = false;
        
        if (!isOnlineMode) {
            checkGameOverAndChangeTurn();
        } else {
            if (hpYellow <= 0 || hpPurple <= 0 || !boardData.some(c => c === null)) {
                setTimeout(() => alert(`ゲーム終了！`), 100);
            }
            // 行動したプレイヤーだけが状態を送信し、相手にターンを渡す
            if (currentPlayer === myColor) {
                pushGameStateToFirebase(currentPlayer === 'yellow' ? 'purple' : 'yellow');
            }
        }
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
    document.querySelectorAll('.highlight-box').forEach(el => el.remove()); 
    if (svgGroup) svgGroup.innerHTML = '';
    
    clearInterval(timerId); timeLeft = 30; timeLeftDisplay.textContent = timeLeft;
    const isMe = currentPlayer === myColor; 
    logDisplay.textContent = isMe ? "あなたのターンです" : "相手のターンです..."; 
    renderBoard(); renderHands();
    
    if (!isMe) { 
        if (!isOnlineMode) setTimeout(autoPlayOpponent, 1500); 
        return; 
    }

    timerId = setInterval(async () => { 
        timeLeft--; timeLeftDisplay.textContent = timeLeft; 
        if (timeLeft <= 0) {
            clearInterval(timerId);
            if (window.isHandSelecting && window.autoSelectAndResolve) {
                window.autoSelectAndResolve();
            } else if (window.isBoardTargeting && window.autoResolveBoardTarget) {
                window.autoResolveBoardTarget();
            } else if (!window.isBoardSelecting && !actionUsedThisTurn) {
                autoPlayTimeout(); 
            }
        }
    }, 1000);
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
                await placeStone(move); // AIも人間と同じ配置ルートを通る
                return;
            }
        }
    }
    logDisplay.textContent = "配置可能キャラなし！パスします。";
    window.isBoardSelecting = false;
    
    if (isOnlineMode) {
        pushGameStateToFirebase(currentPlayer === 'yellow' ? 'purple' : 'yellow');
    } else {
        setTimeout(checkGameOverAndChangeTurn, 1000);
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
        await placeStone(validMoves[Math.floor(Math.random() * validMoves.length)]); // AIも人間と同じルートを通る
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
                if (boardData[i].id) stone.style.backgroundImage = `url('cards/${boardData[i].id}.png')`; 
                stone.innerHTML = `<div class="card-name card-text-node">${boardData[i].name || ''}</div>`; 
            }
            if(hasGlow) stone.classList.add('active-buff-glow');
            cell.appendChild(stone);
        } else if (hasGlow) {
            cell.classList.add('active-buff-glow'); 
        }
        
        // 人間のターンの場合のみクリックによる盤面配置を許可
        cell.addEventListener('click', () => {
            if (currentPlayer === myColor) placeStone(i);
        });
        boardElement.appendChild(cell);
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

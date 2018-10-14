$(document).ready(initApp);

function initApp(){
    buildGameBoardArray();
    buildGameBoard();
    applyClickHandlers();   
}

//*******Globals****//
var gameBoardArray;
var destRow;
var destCol;
var timer;
var blackTurn = true;
var currentColor;
var checkAdjacentObj = {
    'up': [-1, 0],
    'upRight': [-1, 1],
    'right': [0, 1],
    'downRight': [1, 1],
    'down': [1, 0],
    'downLeft': [1, -1],
    'left': [0, -1],
    'upLeft': [-1, -1]
}
var oppPieceObj = {
    'b': 'w',
    'w': 'b'
}
var moveCounterObj = {};
var turnTrackerObj = {};
var lobbyName;
var blackSeconds = 0;
var blackMinutes = 0;
var whiteSeconds = 0;
var whiteMinutes = 0;
var whitePassFlag = false;
var blackPassFlag = false;
var myPlayerColor = null;
var playerTurn = null;
var winningPlayer = 'none';

function applyClickHandlers(){
    $(".gameboard").on('click', '.gameboard-tile', handleBoardClick);
    $(".reset").on('click', resetBoard);
    $(".pass").on('click', checkDoublePass);
    $(".playagain").on('click', playAgain);
    $(".rules").on('click', showRulesModal);
    $(".rulebook").on('click', hideRulesModal);
    $(".playonline").on('click', showLobbyModal);
    $('.playlocal').on('click', hideIntroModal);
    $('.startlobby').on('click', startFirebaseLobby);
    $('.joinlobby').on('click', joinFirebaseLobby);
}

// Initialize Firebase
var config = {
    apiKey: "AIzaSyCArYmACtukWy_IT7MDbXfkdlLMqc2FDgc",
    authDomain: "reversi-abc123.firebaseapp.com",
    databaseURL: "https://reversi-abc123.firebaseio.com",
    projectId: "reversi-abc123",
    storageBucket: "reversi-abc123.appspot.com",
    messagingSenderId: "957372485133"
};
firebase.initializeApp(config);
var database = firebase.database();
var databaseLobby;

function startFirebaseLobby(){
    $('.pointsboard-black').addClass('chip-hop');
    lobbyName = $('.startlobbyinput').val();
    hideLobbyModal();
    myPlayerColor = 'black';
    databaseLobby = database.ref(lobbyName);
    var data = {
        gameArray: gameBoardArray,
        playerTurn: 'black',
        bSec: blackSeconds,
        bMin: blackMinutes,
        wSec: whiteSeconds,
        wMin: whiteMinutes,
        bPass: false,
        wPass: false,
        winner: 'none'
    }
    databaseLobby.set(data);
    databaseLobby.on("value", gotData)
}

function restartFirebaseLobby(){
    var data = {
        gameArray: gameBoardArray,
        playerTurn: 'black',
        bSec: blackSeconds,
        bMin: blackMinutes,
        wSec: whiteSeconds,
        wMin: whiteMinutes,
        bPass: false,
        wPass: false,
        winner: 'none'
    }
    databaseLobby.set(data);
}

function joinFirebaseLobby(){
    $('.pointsboard-black').addClass('chip-hop');
    var lobbyName = $('.joinlobbyinput').val();
    hideLobbyModal();
    myPlayerColor = 'white';
    databaseLobby = database.ref(lobbyName);
    databaseLobby.on("value", gotData);
    blackTurn = false;
}
function error(err){
    console.log(err)
}
function gotData(data){
    var dataObj = data.val();
    gameBoardArray = dataObj.gameArray;
    playerTurn = dataObj.playerTurn;
    stopTimer();
    blackSeconds = dataObj.bSec;
    blackMinutes = dataObj.bMin;
    whiteSeconds = dataObj.wSec;
    whiteMinutes = dataObj.wMin;
    blackPassFlag = dataObj.bPass;
    whitePassFlag = dataObj.wPass;
    winningPlayer = dataObj.winner;
    if(winningPlayer !== 'none'){
        playerWon(winningPlayer);
        return;
    } else{
        rebuildGameBoard(); 
    }
    if(playerTurn === 'black'){
        startBlackTimer();
        blackTurn = true;
        $('.pointsboard-white').removeClass('chip-hop');
        $('.pointsboard-black').addClass('chip-hop');
    } else {
        startWhiteTimer();
        blackTurn = false;
        $('.pointsboard-black').removeClass('chip-hop');
        $('.pointsboard-white').addClass('chip-hop');
    }
}

// Game Board Functions
function buildGameBoardArray(){
    gameBoardArray = [
        ['', '', '', '', '', '', '', '' ],
        ['', '', '', '', '', '', '', '' ],
        ['', '', '', '', '', '', '', '' ],
        ['', '', '', 'w', 'b', '', '', '' ],
        ['', '', '', 'b', 'w', '', '', '' ],
        ['', '', '', '', '', '', '', '' ],
        ['', '', '', '', '', '', '', '' ],
        ['', '', '', '', '', '', '', '' ]
    ]
}
function buildGameBoard(){
    var gameArea = $('.gameboard');
    var tallyWhite = 0;
    var tallyBlack = 0;
    for(var i = 0; i< gameBoardArray.length; i++){
        for(var j = 0; j< gameBoardArray.length; j++){
            if(gameBoardArray[i][j] === ''){
                var boardDiv = $('<div>').addClass('gameboard-tile');
                var topDiv = $('<div>').addClass('top-div').attr({'row': i,'col': j});
                boardDiv.append(topDiv);
            } else if(gameBoardArray[i][j] === 'w'){
                tallyWhite++;
                var boardDiv = $('<div>').addClass('gameboard-tile');
                var topDiv = $('<div>').addClass('top-div white-piece').attr({'row': i,'col': j});
                boardDiv.append(topDiv);
            } else {
                tallyBlack++
                var boardDiv = $('<div>').addClass('gameboard-tile');
                var topDiv = $('<div>').addClass('top-div black-piece').attr({'row': i,'col': j});
                boardDiv.append(topDiv);
            }
            gameArea.append(boardDiv);
        }
    }
    updateScore(tallyWhite, tallyBlack);
}

function handleBoardClick(){
    if(myPlayerColor !== playerTurn){
        console.log('not your turn')
        return;
    }
    if(blackTurn){
        currentColor = 'b';   
    } else{
        currentColor = 'w';
    }
    destRow = parseInt($(event.target).attr('row'));
    destCol = parseInt($(event.target).attr('col'));
    if(gameBoardArray[destRow][destCol] !== ''){
        return;
    }
    checkAdjacentTiles();
    if(turnTrackerObj[currentColor] !== undefined){
        switchTurns();  
    }  
}
function checkAdjacentTiles(){
    for( key in checkAdjacentObj){
        var adjTileRow = destRow + checkAdjacentObj[key][0];
        var adjTileCol = destCol + checkAdjacentObj[key][1];
        if(adjTileRow > 7 || adjTileRow < 0){
            continue;
        }
        if(adjTileCol > 7 || adjTileCol < 0){
            continue;
        }
        if(gameBoardArray[adjTileRow][adjTileCol] === oppPieceObj[currentColor]){
            checkForValidMove(key, adjTileRow, adjTileCol);
        }   
    }  
}

function checkForValidMove(direction, adjTileRow, adjTileCol){
    var nextTileRow = adjTileRow + checkAdjacentObj[direction][0];
    var nextTileCol = adjTileCol + checkAdjacentObj[direction][1];
    if(nextTileRow > 7 || nextTileRow < 0){
        return;
    }
    if(nextTileCol > 7 || nextTileCol < 0){
        return;
    }
    if(gameBoardArray[nextTileRow][nextTileCol] === ''){
        return;
    }
    if(gameBoardArray[nextTileRow][nextTileCol] === currentColor){
        if(moveCounterObj[direction] === undefined){
            moveCounterObj[direction] = 1;
        } else {
            moveCounterObj[direction] += 1;
        }
        changePieces(direction, nextTileRow, nextTileCol);
        return;
    }
    if(gameBoardArray[nextTileRow][nextTileCol] === oppPieceObj[currentColor]){
        if(moveCounterObj[direction] === undefined){
            moveCounterObj[direction] = 1;
        } else {
            moveCounterObj[direction] += 1;
        }
        checkForValidMove(direction, nextTileRow, nextTileCol);
        return;
    }
}

function changePieces(direction){
    if(turnTrackerObj[currentColor] === undefined){
        turnTrackerObj[currentColor] = 1;
    } else{
        turnTrackerObj[currentColor] += 1;
    }
    var changedRow = destRow;
    var changedCol = destCol;
    gameBoardArray[destRow][destCol] = currentColor;
    for(var i = 0; i < moveCounterObj[direction]; i++){
        changedRow = changedRow + checkAdjacentObj[direction][0];
        changedCol = changedCol + checkAdjacentObj[direction][1];
        gameBoardArray[changedRow][changedCol] = currentColor;   
    }
    whitePassFlag = false;
    blackPassFlag = false;
    rebuildGameBoard();
}
function rebuildGameBoard(){
    $('.gameboard').empty();
    buildGameBoard();
}

function switchTurns(){
    if(playerTurn === 'black'){
        stopTimer();
        var updatedObj = {
            gameArray: gameBoardArray,
            playerTurn: 'white',
            bSec: blackSeconds,
            bMin: blackMinutes,
            wSec: whiteSeconds,
            wMin: whiteMinutes,
            bPass: blackPassFlag,
            wPass: whitePassFlag,
            winner: winningPlayer
        }
        playerTurn = 'white';
        databaseLobby.update(updatedObj);
    } else if (playerTurn === 'white'){
        stopTimer();
        var updatedObj = {
            gameArray: gameBoardArray,
            playerTurn: 'black',
            bSec: blackSeconds,
            bMin: blackMinutes,
            wSec: whiteSeconds,
            wMin: whiteMinutes,
            bPass: blackPassFlag,
            wPass: whitePassFlag,
            winner: winningPlayer
        }
        playerTurn = 'black';
        databaseLobby.update(updatedObj);
    }
    if(blackTurn && playerTurn === null){
        $('.pointsboard-black').removeClass('chip-hop');
        $('.pointsboard-white').addClass('chip-hop');
        stopTimer();
        startWhiteTimer();
        blackTurn = false;
    } else if (!blackTurn && playerTurn === null){
        $('.pointsboard-white').removeClass('chip-hop');
        $('.pointsboard-black').addClass('chip-hop');
        stopTimer();
        startBlackTimer();
        blackTurn = true;
    }
    turnTrackerObj = {};
    moveCounterObj = {};
}

function resetBoard(){
    blackTurn = true;
    moveCounterObj = {};
    hasTimerStarted = false;
    turnTrackerObj = {};
    stopTimer();
    $('.pointsboard-white').removeClass('chip-hop');
    $('.pointsboard-black').addClass('chip-hop');
    blackSeconds = 0;
    blackMinutes = 0;
    whiteSeconds = 0;
    whiteMinutes = 0;
    $('.white-seconds').text('0' + whiteSeconds)
    $('.white-minutes').text('0' + whiteMinutes)
    $('.black-seconds').text('0' + blackSeconds)
    $('.black-minutes').text('0' + blackMinutes)
    whitePassFlag = false;
    blackPassFlag = false;
    winningPlayer = 'none';
    buildGameBoardArray();
    rebuildGameBoard();
    if(myPlayerColor !== null){
        restartFirebaseLobby();
    }
}

// Score Board
function updateScore(tallyWhite, tallyBlack){
    $('.pointsW').text(tallyWhite);
    $('.pointsB').text(tallyBlack);
    if(tallyBlack + tallyWhite > 4){
        checkWinCondition(tallyWhite, tallyBlack);
    }
}

function checkWinCondition(white, black){
    var totalTally = white + black;
    if(totalTally === 64 || winningPlayer !== 'none' || (whitePassFlag === true && blackPassFlag === true)){
        stopTimer();
        if(white > black){
            playerWon('White');
            winningPlayer = 'White';
            return;
        }else if (white < black){
            playerWon('Black');
            winningPlayer = 'Black';
            return;
        }
        if(white === black && totalTally > 4){
            playerWon('Tie');
            winningPlayer = 'Tie'
            return;
        }
        switchTurns();
    }
}

function playerWon( player ){
    if(player === 'Tie'){
        $('.win-modal > h1').text("It's a " + player);
        showWinModal();
    }else{
        $('.win-modal > h1').text(player + ' Wins!');
        showWinModal();
    }
}

function checkDoublePass(){
    if(playerTurn !== myPlayerColor){
        return;
    }
    
    if(whitePassFlag === false && blackPassFlag === false){
        if(blackTurn){
            blackPassFlag = true;
        }else{
            whitePassFlag = true;
        }
    }else if(whitePassFlag === true && blackPassFlag === false){
        blackPassFlag = true;
        rebuildGameBoard();
    }else if(blackPassFlag === true && whitePassFlag === false){
        whitePassFlag = true;
        rebuildGameBoard();
    }
    switchTurns();
}

function playAgain(){
    console.log('play again')
    hideWinModal(); 
    resetBoard();
}
function startBlackTimer(){
    timer = setInterval(function(){
        if(blackSeconds < 59){
            blackSeconds++;
            if(blackSeconds < 10){
                $('.black-seconds').text('0'+ blackSeconds);
            }else{
                $('.black-seconds').text(blackSeconds);
            }
        }else{
            blackMinutes++;
            blackSeconds = 0; 
            $('.black-seconds').text('0'+ blackSeconds);
            if(blackMinutes < 10){
                $('.black-minutes').text('0'+ blackMinutes);
            }else{  
                $('.black-minutes').text(blackMinutes);
            } 
        }
    }, 1000); 
}

function startWhiteTimer(){
    timer = setInterval(function(){
        if(whiteSeconds < 59){
            whiteSeconds++;
            if(whiteSeconds < 10){
                $('.white-seconds').text('0'+ whiteSeconds);
            }else{
                $('.white-seconds').text(whiteSeconds);
            }
        }else{
            whiteMinutes++;
            whiteSeconds = 0; 
            $('.white-seconds').text('0'+ whiteSeconds);
            if(whiteMinutes < 10){
                $('.white-minutes').text('0'+ whiteMinutes);
            }else{  
                $('.white-minutes').text(whiteMinutes);
            } 
        }
    }, 1000); 
}

function stopTimer(){
    clearInterval(timer);
}

function showLobbyModal(){
    goToLobbyModal();
    $('.intro-modal').addClass('hidden');
    $('.lobby-modal').removeClass('displaynone');
    $('.lobby-modal').addClass('show');
}
function hideLobbyModal(){
    $('.lobby-modal').addClass('hidden');
    $('.lobby-modal').removeClass('show');
    $('.modal-background').addClass('hiddenbackground');
}

function goToLobbyModal(){
    $('.intro-modal').addClass('hidden');
}
function hideIntroModal(){
    $('.pointsboard-black').addClass('chip-hop');
    $('.intro-modal').addClass('hidden');
    $('.modal-background').addClass('hiddenbackground');
}
function showIntroModal(){
    $('.intro-modal').removeClass('hidden');
    $('.modal-background').removeClass('hiddenbackground displaynone');
    $('.intro-modal').addClass('show');
    $('.modal-background').addClass('showbackground');
}

function hideWinModal(){
    $('.win-modal').removeClass('show');
    $('.modal-background').removeClass('showbackground');
    $('.modal-background').addClass('hiddenbackground');
    $('.win-modal').addClass('hidden');
}

function showWinModal(){
    $('.modal-background').removeClass('hiddenbackground displaynone');
    $('.win-modal').removeClass('hidden displaynone')
    $('.modal-background').addClass('showbackground');
    $('.win-modal').addClass('show');
}

function showRulesModal(){
    $('.modal-background').removeClass('hiddenbackground displaynone');
    $('.rule-modal').removeClass('hidden displaynone');;
    $('.modal-background').addClass('showbackground');
    $('.rule-modal').addClass('show');
}

function hideRulesModal(){
    $('.rule-modal').removeClass('show');
    $('.modal-background').removeClass('showbackground');
    $('.modal-background').addClass('hiddenbackground');
    $('.rule-modal').addClass('hidden');
}

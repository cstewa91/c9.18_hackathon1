$(document).ready(initApp);

function initApp(){
    buildGameBoardArray();
    buildGameBoard();
    applyClickHandlers();
    $('.pointsboard-black').addClass('chip-hop'); 
}

//*******Globals****//
var gameBoardArray;
var destRow;
var destCol;
var timer;
var blackTurn = true;
var whiteTurn = false;
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
var turnTrackerObj = {}
var directionToCheck = null;
var hasTimerStarted = false;
var blackSeconds = 0;
var blackMinutes = 0;
var whiteSeconds = 0;
var whiteMinutes = 0;
var whitePassFlag = false;
var blackPassFlag = false;

function applyClickHandlers(){
    $(".gameboard").on('click', '.gameboard-tile', handleBoardClick);
    $(".playlocal").on('click', hideIntroModal);
    $(".playonline").on('click', hideIntroModal);
    $(".reset").on('click', resetBoard);
    $(".pass").on('click', switchTurns);
    $(".pass").on('click', checkDoublePass);
    $(".playagain").on('click', playAgain);
    $(".rules").on('click', showRulesModal);
    $(".rulebook").on('click', hideRulesModal);
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
    for(var i = 0; i< gameBoardArray.length; i++){
        for(var j = 0; j< gameBoardArray.length; j++){
            if(gameBoardArray[i][j] === ''){
                var boardDiv = $('<div>').addClass('gameboard-tile').attr({'row': i,'col': j});
                var topDiv = $('<div>').addClass('top-div').attr({'row': i,'col': j});
                boardDiv.append(topDiv);
            } else if(gameBoardArray[i][j] === 'w'){
                var boardDiv = $('<div>').addClass('gameboard-tile').attr({'row': i,'col': j});
                var topDiv = $('<div>').addClass('top-div white-piece').attr({'row': i,'col': j});
                boardDiv.append(topDiv);
            } else {
                var boardDiv = $('<div>').addClass('gameboard-tile').attr({'row': i,'col': j});
                var topDiv = $('<div>').addClass('top-div black-piece').attr({'row': i,'col': j});
                boardDiv.append(topDiv);
            }
            gameArea.append(boardDiv);
        }
    }
    keepScore();
}

function resetBoard(){
    blackTurn = true;
    whiteTurn = false;
    moveCounterObj = {};
    directionToCheck = null;
    hasTimerStarted = false;
    turnTrackerObj = {};
    $('.gameboard').empty();
    buildGameBoardArray();
    buildGameBoard();
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
}

function handleBoardClick(){
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
            directionToCheck = key;
        }
        if(directionToCheck){
            directionCheck(directionToCheck, adjTileRow, adjTileCol);
        }
        directionToCheck = null;    
    }
    
}

function directionCheck(direction, adjTileRow, adjTileCol){
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
        directionCheck(direction, nextTileRow, nextTileCol);
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
    $('.gameboard').empty();
    buildGameBoard();
}

function switchTurns(){
    if(blackTurn){
        $('.pointsboard-black').removeClass('chip-hop');
        $('.pointsboard-white').addClass('chip-hop');
        stopTimer();
        startWhiteTimer();
        blackTurn = false;
        whiteTurn = true;
    } else {
        $('.pointsboard-white').removeClass('chip-hop');
        $('.pointsboard-black').addClass('chip-hop');
        stopTimer();
        startBlackTimer();
        blackTurn = true;
        whiteTurn = false;
    }
    turnTrackerObj = {};
    moveCounterObj = {};
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
// Score Board
function keepScore(){
    var tallyWhite = null;
    var tallyBlack = null;
    for( var i=0;i<gameBoardArray.length; i++){
        for(var j=0;j<gameBoardArray[i].length;j++){
            if (gameBoardArray[i][j] === 'b'){
                tallyBlack++;
            } else if (gameBoardArray[i][j] === 'w'){
                tallyWhite++;
            }
        }
    }
    $('.pointsW').text(tallyWhite);
    $('.pointsB').text(tallyBlack);
    checkWinCondition(tallyWhite, tallyBlack);
    return tallyWhite + ' ' + tallyBlack;
}

function checkWinCondition(white, black){
    var totalTally = white + black
    if(totalTally === 64 || (whitePassFlag === true && blackPassFlag === true)){
        if(white > black){
            playerWon('White')
            stopTimer();
        }else if(black > white){
            playerWon('Black')
            stopTimer();
        }else{
            playerWon('Tie')
        }
    }
}

function playerWon( player ){
    if(player === 'White' || player === 'Black'){
        $('.win-modal > h1').text(player + ' Wins!');
        showWinModal();
    }else{
        $('.win-modal > h1').text("It's a " + player);
        showWinModal();
    }
}

function hideIntroModal(){
    $('.intro-modal').addClass('hidden');
    $('.modal-background').addClass('hidden2');
}
function showIntroModal(){
    $('.intro-modal').removeClass('hidden');
    $('.modal-background').removeClass('hidden2 displaynone');
    $('.intro-modal').addClass('show');
    $('.modal-background').addClass('show2');
}

function hideWinModal(){
    $('.win-modal').removeClass('show');
    $('.modal-background').removeClass('show2');
    $('.modal-background').addClass('hidden2');
    $('.win-modal').addClass('hidden');
}

function showWinModal(){
    $('.modal-background').removeClass('hidden2 displaynone');
    $('.win-modal').removeClass('hidden displaynone')
    $('.modal-background').addClass('show2');
    $('.win-modal').addClass('show');
}

function showRulesModal(){
    $('.modal-background').removeClass('hidden2');
    $('.rule-modal').removeClass('hidden displaynone');;
    $('.modal-background').addClass('show2');
    $('.rule-modal').addClass('show');
}

function hideRulesModal(){
    $('.rule-modal').removeClass('show');
    $('.modal-background').removeClass('show2');
    $('.modal-background').addClass('hidden2');
    $('.rule-modal').addClass('hidden');
}

function checkDoublePass(){
    var counts = keepScore();
    var countsArray = counts.split(' ');
    var tallyWhite = parseInt(countsArray[0]);
    var tallyBlack = parseInt(countsArray[1]);

    if(whitePassFlag === false && blackPassFlag === false){
        if(blackTurn){
            whitePassFlag = true;
        }else{
            blackPassFlag = true;
        }
    }else if(whitePassFlag === true && blackPassFlag === false){
        blackPassFlag = true;
        checkWinCondition(tallyWhite, tallyBlack);
    }else if(blackPassFlag === true && whitePassFlag === false){
        whitePassFlag = true;
        checkWinCondition(tallyWhite, tallyBlack);
    }
}

function playAgain(){
    hideWinModal(); 
    resetBoard();
}

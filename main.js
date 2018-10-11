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
var counterObj = {};
var turnTrackerObj = {}
var directionToCheck = null;
var hasTimerStarted = false;

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
function applyClickHandlers(){
    $(".gameboard").on('click', '.gameboard-tile', handleBoardClick);
    $(".reset-button").on('click', resetBoard)
}

function resetBoard(){
    blackTurn = true;
    whiteTurn = false;
    counterObj = {};
    directionToCheck = null;
    hasTimerStarted = false;
    turnTrackerObj = {};
    $('.gameboard').empty();
    buildGameBoardArray();
    buildGameBoard();
    keepScore();
    stopTimer()
    

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
        console.log('Tile is not empty');
        return;
    }
    checkAdjacentTiles();
    if(turnTrackerObj[currentColor] !== undefined){
        switchTurns();  
    }  
}
function checkAdjacentTiles(){
    console.log('in checkadjtile function')
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
            console.log('direction', directionToCheck)
            directionCheck(directionToCheck, adjTileRow, adjTileCol);
        }
        directionToCheck = null;    
    }
    
}
function directionCheck(direction, adjTileRow, adjTileCol){
    console.log('in direction check fun')
    var nextTileRow = adjTileRow + checkAdjacentObj[direction][0];
    var nextTileCol = adjTileCol + checkAdjacentObj[direction][1];
    if(nextTileRow > 7 || nextTileRow < 0){
        console.log('off board')
        return;
    }
    if(nextTileCol > 7 || nextTileCol < 0){
        console.log('off board')
        return;
    }
    if(gameBoardArray[nextTileRow][nextTileCol] === ''){
        return;
    }
    if(gameBoardArray[nextTileRow][nextTileCol] === currentColor){
        console.log('test1')
        if(counterObj[direction] === undefined){
            counterObj[direction] = 1;
        } else {
            counterObj[direction] += 1;
        }
        changePieces(direction, nextTileRow, nextTileCol);
        return;
    }
    if(gameBoardArray[nextTileRow][nextTileCol] === oppPieceObj[currentColor]){
        console.log('test2')
        if(counterObj[direction] === undefined){
            counterObj[direction] = 1;
        } else {
            counterObj[direction] += 1;
        }
        directionCheck(direction, nextTileRow, nextTileCol);
        return;
    }
}

function changePieces(direction){
    if(!hasTimerStarted){
        startTimer();
        hasTimerStarted = true;
    }
    if(turnTrackerObj[currentColor] === undefined){
        turnTrackerObj[currentColor] = 1;
    } else{
        turnTrackerObj[currentColor] += 1;
    }
    var changedRow = destRow;
    var changedCol = destCol;
    gameBoardArray[destRow][destCol] = currentColor;
    for(var i = 0; i < counterObj[direction]; i++){
        console.log('for loop', counterObj[direction])
        changedRow = changedRow + checkAdjacentObj[direction][0];
        changedCol = changedCol + checkAdjacentObj[direction][1];
        gameBoardArray[changedRow][changedCol] = currentColor;
        
    }
    console.log(gameBoardArray)
    $('.gameboard').empty();
    buildGameBoard();

}
function switchTurns(){
    if(blackTurn){
        blackTurn = false;
        whiteTurn = true;
    } else {
        blackTurn = true;
        whiteTurn = false;
    }
    console.log('current turns black: ', blackTurn)
    turnTrackerObj = {};
    counterObj = {};
}

function startTimer(){
    var counter = 0;
    var minutes = 0;
    timer = setInterval(function(){
        if(counter < 59){
        counter++;
        console.log(counter);
        }else{
            minutes++;
            counter = 0;    
            console.log('minutes',minutes);
        }
    }, 1000); 
}

function stopTimer(){
    clearInterval(timer);
}


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
var counterObj = {};
var turnTrackerObj = {}
var directionToCheck = null;
var hasTimerStarted = false;
var blackSeconds = 0;
var blackMinutes = 0;
var whiteSeconds = 0;
var whiteMinutes = 0;
var multiplayer = true;
var player1 = true;
var gameLobby = 'temp';
var gameLobbyTurn = null;
var dbRef;
var myTurnRef;
var myTurn;

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
    $('.option1').on('click', multiStartLobby);
    $('.option2').on('click', multiJoinLobby);
    $(".reset").on('click', resetBoard);
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

}
function localPlay(){
    multiplayer = false;
    player1 = true;
    gameLobby = null;
}
function multiStartLobby(){
    hideModal();
    multiplayer = true;
    blackTurn = true;
    whiteTurn = false;
    player1 = true;
    gameLobby = 'temp';
    gameLobbyTurn = gameLobby + 'turn';
    firebase.database().ref('games/' + gameLobby).set({
        arr: gameBoardArray
      });
    firebase.database().ref('games/' + gameLobbyTurn).set({
        blackTurn: true
    });
    createRefs();
}
function multiJoinLobby(){
    console.log('test')
    hideModal();
    multiplayer = true;
    blackTurn = false;
    whiteTurn = true;
    player1 = false;
    gameLobby = 'temp';
    gameLobbyTurn = gameLobby + 'turn';
    firebase.database().ref('games/' + gameLobbyTurn).set({
        blackTurn: true
      });
    createRefs();
}
function createRefs(){
    dbRef = firebase.database().ref('games/' + gameLobby );
    dbRef.on('value', function(snapshot) {
    console.log('dbsnapshot', snapshot.val());
    });
    myTurnRef = firebase.database().ref('games/' + gameLobbyTurn );
    myTurnRef.on('value', function(snapshot) {
    myTurn = snapshot.val();
    });
    console.log('myturn', myTurn.blackTurn)
}
function updateRefs(){
    myTurnRef.on('value', function(snapshot) {
        myTurn = snapshot.val();
    });
    dbRef.on('value', function(snapshot) {
        var array1 = snapshot.val();
        gameBoardArray = array1.arr;
        console.log('gameboardarrrr', array1.arr)
    });
    
    $('.gameboard').empty();
    buildGameBoard();
}

function handleBoardClick(){
    if(multiplayer && !player1){
        console.log('Multiplayer not my turn');
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
            directionToCheck = key;
        }
        if(directionToCheck){
            directionCheck(directionToCheck, adjTileRow, adjTileCol);
        }
        directionToCheck = null;    
    }
    
}
function directionCheck(direction, adjTileRow, adjTileCol){
    console.log('arguments', arguments)
    var nextTileRow = adjTileRow + checkAdjacentObj[direction][0];
    var nextTileCol = adjTileCol + checkAdjacentObj[direction][1];
    if(nextTileRow > 7 || nextTileRow < 0){
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
        if(counterObj[direction] === undefined){
            counterObj[direction] = 1;
        } else {
            counterObj[direction] += 1;
        }
        changePieces(direction, nextTileRow, nextTileCol);
        return;
    }
    if(gameBoardArray[nextTileRow][nextTileCol] === oppPieceObj[currentColor]){
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
    if(turnTrackerObj[currentColor] === undefined){
        turnTrackerObj[currentColor] = 1;
    } else{
        turnTrackerObj[currentColor] += 1;
    }
    var changedRow = destRow;
    var changedCol = destCol;
    gameBoardArray[destRow][destCol] = currentColor;
    for(var i = 0; i < counterObj[direction]; i++){
        changedRow = changedRow + checkAdjacentObj[direction][0];
        changedCol = changedCol + checkAdjacentObj[direction][1];
        gameBoardArray[changedRow][changedCol] = currentColor;
        
    }
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
        
        if(multiplayer && myTurn.blackTurn){
            player1 = !player1
            firebase.database().ref('games/' + gameLobby).set({
                arr: gameBoardArray
              });
            firebase.database().ref('games/' + gameLobbyTurn).set({
                blackTurn: false
            });
            updateRefs();
        }
    } else {
        $('.pointsboard-white').removeClass('chip-hop');
        $('.pointsboard-black').addClass('chip-hop');
        stopTimer();
        startBlackTimer();
        blackTurn = true;
        whiteTurn = false;
        if(multiplayer && !myTurn.blackTurn){
            player1 = !player1
            firebase.database().ref('games/' + gameLobby).set({
                arr: gameBoardArray
              });
            firebase.database().ref('games/' + gameLobbyTurn).set({
                blackTurn: true
            });
            updateRefs();
        }
    }
    turnTrackerObj = {};
    counterObj = {};
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

function hideModal(){
    $('.intro-modal').addClass('hidden');
    $('.modal-background').addClass('hidden2');
}
function showModal(){
    $('.intro-modal').removeClass('hidden');
    $('.modal-background').removeClass('hidden2');
    $('.intro-modal').addClass('show');
    $('.modal-background').addClass('show2');
}

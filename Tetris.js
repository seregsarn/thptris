var timer = 0;
var WELL_HEIGHT = 16;
var WELL_WIDTH = 10;
var LOCK_DELAY = 400;
var TICK_DELAY = 500;
var CLEAR_DELAY = 300;
var pieces = [
    new Tetromino("O", "yellow", [
        [0,0,0,0],
        [0,1,1,0],
        [0,1,1,0],
        [0,0,0,0]
    ])
    ,new Tetromino("I", "red", [
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ])
    ,new Tetromino("J", "orange", [
        [0,0,0],
        [1,1,1],
        [0,0,1]
    ])
    ,new Tetromino("L", "dodgerblue", [
        [0,0,0],
        [1,1,1],
        [1,0,0]
    ])
    ,new Tetromino("Z", "palegreen", [
        [0,0,0],
        [1,1,0],
        [0,1,1]
    ])
    ,new Tetromino("S", "hotpink", [
        [0,0,0],
        [0,1,1],
        [1,1,0]
    ])
    ,new Tetromino("T", "cyan", [
        [0,0,0],
        [1,1,1],
        [0,1,0]
    ])
];
    

function debug(s) {
    if (location.search == "?debug") {
        $('#debugLog').html($('#debugLog').html() + "<br>" + s);
    }
}

Array.prototype.choose = function() { return this[Math.floor(Math.random()*this.length)]; };
Array.prototype.shuffle = function() {
    var cidx = this.length;
    var temp;
    var ridx;
    while (cidx != 0) {
        ridx = Math.floor(Math.random() * cidx);
        cidx--;
        temp = this[cidx];
        this[cidx] = this[ridx];
        this[ridx] = temp;
    }
};

function newWell() {
    var w = [];
    for (var i = 0; i < 20; i++) {
        var row = [0,0,0,0,0,0,0,0,0,0];
        w.push(row);
    }
    return w;
}
function makeSequence() {
    var seq = [];
    for (i = 0; i < 4; i++) {
        var next = [0,1,2,3,4,5,6];
        next.shuffle();
        seq = seq.concat(next);
    }
    return seq;
}
function pickPiece(history, version) {
    var tries = 0;
    do {
        var p = Math.floor(Math.random() * pieces.length);
    } while (history.includes(p) && tries++ < 4);
    return p;
}

function flip() {
    var data = $('#canvas').get(0).toDataURL('image/png');
    //console.log(data);
    $('#favicon').get(0).href = data;
}

$(document).ready(function() {
    // 20 high
    // 23+ invisible rows above that
    // ARE 0
    
    // build well
    var well = newWell();
    // set up piece history and state
    var lines = 0;
    var points = 0;
    var combo = 0;
    var t_kick = 0;
    var t_spin = 0;
    var rotated = 0;
    var kicked = 0;
    var history = [4,4,5,5];
    var gameOver = true;
    var clearing = false;
    //var history = [];
    var piece; // which piece currently is being placed
    var nextpiece; // and the next one
    var x, y; // the position of the piece template.
    var rot; // the rotation of the piece.
    // build canvas
    var canvas = document.createElement('canvas');
    canvas.width = 16; canvas.height = 16;
    //canvas.style = 'width: 64px; border: 1px dotted red;';
    canvas.style = 'display: none; image-rendering: pixelated;';
    canvas.id = 'canvas';
    $('#lines').before(canvas);
    var ctx = canvas.getContext('2d');
    ctx.lineWidth = 1;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    ctx.imageSmoothingQuality = "medium";
    
    // set up piece state
    piece = pickPiece(history);
    nextpiece = pickPiece(history);
    rot = 0;
    xp = 4; yp = WELL_HEIGHT - 2;

    function clearScreen() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0,0,16,16);
    }
    function drawPixel(x,y,color) {
        ctx.fillStyle = color;
        ctx.fillRect(x,y,1,1);
    }
    function wellToScreen(xw, yw) {
        return [xw + 3, WELL_HEIGHT - 2 - yw];
    }
    function drawWell() {
        for (var j = 0; j < WELL_HEIGHT; j++) {
            for (var i = 0; i < WELL_WIDTH; i++) {
                var [xs,ys] = wellToScreen(i,j);
                var bit = well[j][i] - 1;
                if (well[j][i] == -1) drawPixel(xs,ys,'white');
                else if (well[j][i] != 0) drawPixel(xs,ys,pieces[bit].color);
            }
        }
    }
    function drawPiece(x,y, piece, rot) {
        var col = pieces[piece].color;
        var [xs, ys] = wellToScreen(xp,yp);
        var tpl = pieces[piece];
        var szy = tpl.maps[rot].length;
        var szx = tpl.maps[rot][0].length;
        for (var i = 0; i < szx; i++) {
            for (var j = 0; j < szy; j++) {
                if (tpl.maps[rot][j][i] != 0) drawPixel(xs - 1 + i,ys - 1 + j, col);
            }
        }
    }
    function pieceBlockedAt(x,y, piece, rot) {
        var tpl = pieces[piece];
        var szy = tpl.maps[rot].length;
        var szx = tpl.maps[rot][0].length;
        for (var i = 0; i < szx; i++) {
            for (var j = 0; j < szy; j++) {
                if (tpl.maps[rot][j][i] == 0) continue;
                if (y + 1 - j < 0) return true;
                if (x - 1 + i < 0 || x - 1 + i > WELL_WIDTH) return true;
                if (well[y+1-j][x-1+i] != 0) return true;
            }
        }
        return false;
    }
    function writePieceAt(x, y, piece, rot) {
        var tpl = pieces[piece];
        var szy = tpl.maps[rot].length;
        var szx = tpl.maps[rot][0].length;
        for (var i = 0; i < szx; i++) {
            for (var j = 0; j < szy; j++) {
                if (tpl.maps[rot][j][i] == 0) continue;
                if (y + 1 - j < 0 || y + 1 - j > WELL_HEIGHT) throw "Invalid placement";
                if (x - 1 + i < 0 || x - 1 + i > WELL_WIDTH) throw "Invalid placement";
                well[y + 1 - j][x - 1 + i] = piece+1;
            }
        }        
    }
    function newGame() {
        if (gameOver) {
            gameOver = false;
            // build well
            well = newWell();
            lines = 0;
            points = 0;
            // set up piece history and state
            history = [4,4,5,5];
            // set up piece state
            piece = pickPiece(history);
            nextpiece = pickPiece(history);
            rot = 0;
            xp = 4; yp = WELL_HEIGHT - 2;
            if (timer == 0) timer = setTimeout(tick, TICK_DELAY);
        }
    }
    function left() {
        if (pieceBlockedAt(xp-1, yp, piece, rot)) return;
        if (pieceBlockedAt(xp, yp-1, piece, rot)) {
            clearTimeout(timer);
            timer = setTimeout(tick, LOCK_DELAY);
        }
        rotated = 0;
        xp -= 1;
    }
    function right() {
        if (pieceBlockedAt(xp+1, yp, piece, rot)) return;
        if (pieceBlockedAt(xp, yp-1, piece, rot)) {
            clearTimeout(timer);
            timer = setTimeout(tick, LOCK_DELAY);
        }
        rotated = 0;
        xp += 1;
    } 
    function rotate(direction=1) {
        var newRot = (rot + direction > 3 ? 0 : rot + direction < 0 ? 3 : rot + direction);
        rotated = 1;
        if (pieceBlockedAt(xp,yp,piece,newRot)) {
            // try right/left rotations
            if (!pieceBlockedAt(xp+1, yp, piece, newRot)) {
                rot = newRot;
                xp += 1;
                kicked = 1;
            } else if (!pieceBlockedAt(xp-1, yp, piece, newRot)) {
                rot = newRot;
                xp -= 1;
                kicked = 1;
            } else if (pieces[piece].name == "I" && !pieceBlockedAt(xp, yp+1, piece, newRot)) {
                rot = newRot;
                yp -= 1;
                kicked = 1;
            } else if (pieces[piece].name == "I" && !pieceBlockedAt(xp, yp+2, piece, newRot)) {
                rot = newRot;
                yp -= 2;
                kicked = 1;
            } else if (pieces[piece].name == "T" && t_kick == 0 && !pieceBlockedAt(xp, yp+1, piece, newRot)) {
                rot = newRot;
                yp -= 1;
                t_kick = 1;
                kicked = 1;
            } else {
                // rotation fails
                rotated = 0;
            }
        } else {
            rot = newRot;
        }
    }
    function endClearing() {
        for (var j = 0; j < WELL_HEIGHT; j++) {
            if (well[j][0] == -1) {
                well.splice(j, 1);
                var newRow = [];
                for (var i = 0; i < WELL_WIDTH; i++) { newRow.push(0); }
                well.push(newRow);
                j -= 1;
            }
        }
        clearing = false;
    }
    function lock() {
        // t-spin bonus
        var t_spin_bonus = 0;
        if (pieces[piece].name == "T" && rotated && !kicked) {
            t_spin = 1;
            t_spin_bonus = 10;
            if (pieceBlockedAt(xp+1, yp, piece, rot) && pieceBlockedAt(xp-1, yp, piece, rot) && pieceBlockedAt(xp, yp+1, piece, rot)) {
                t_spin = 2;
                t_spin_bonus = 500;
            }
        } else {
            t_spin = 0;
            t_spin_bonus = 0;
        }
        // lock piece
        writePieceAt(xp, yp, piece, rot);
        history.unshift(piece);
        history.pop();
        //console.log("locked " + pieces[piece].name + ", r" + rotated + "k" + kicked, pieces[piece]);
        t_kick = 0;
        rotated = 0;
        kicked = 0;
        piece = nextpiece;
        nextpiece = pickPiece(history);
        rot = 0;
        xp = 4; yp = WELL_HEIGHT - 2;
        if (pieceBlockedAt(xp,yp, piece, rot)) {
            // game ovada.
            gameOver = true;
            clearTimeout(timer); timer = 0;
        }
        var clearedLines = 0;
        // clear lines, if appropriate.
        for (var j = 0; j < WELL_HEIGHT; j++) {
            var blocks = 0;
            for (var i = 0; i < WELL_WIDTH; i++) {
                if (well[j][i] != 0) blocks++;
            }
            if (blocks >= WELL_WIDTH) {
                clearedLines += 1;
                clearing = true;
                for (var i = 0; i < WELL_WIDTH; i++) {
                    well[j][i] = -1;
                }
            }
        }
        if (clearedLines > 0) {
            lines += clearedLines;
            points += (clearedLines == 4 ? 800 : clearedLines == 3 ? 500 : clearedLines == 2 ? 300 : 100);
            points += 50 * combo;
            points += t_spin_bonus * (combo > 0 ? combo : 1) * clearedLines;
            if (points > 999999) points = 999999;
            combo += 1;
            setTimeout(endClearing, CLEAR_DELAY);
        } else {
            points += t_spin_bonus * (combo > 0 ? combo : 1);
            combo = 0;
        }
    }
    function drop(manual=false) {
        if (pieceBlockedAt(xp,yp - 1, piece, rot)) {
            lock();
        } else {
            yp -= 1;
            if (manual) { points += 1; if (points > 999999) points = 999999; }
            kicked = 0;
            rotated = 0;
        }
    }
    function sonicDrop() {
        var dropped = false;
        while (!pieceBlockedAt(xp, yp-1, piece, rot)) {
            yp -= 1;
            points += 2;
            if (points > 999999) points = 999999;
            dropped = true;
            rotated = 0;
        }
        if (dropped) {
            clearTimeout(timer);
            timer = setTimeout(tick, LOCK_DELAY);
        }
    }
    function describeNext() {
        if (gameOver) return "";
        var i;
        return " - [" + pieces[nextpiece].name + "]";
    }
    function redraw() {
        // render screen
        clearScreen();
        if (!gameOver) {
            ctx.strokeStyle = 'grey';
            ctx.filter = 'none';
            ctx.strokeRect(2.5,-0.5,WELL_WIDTH + 1,WELL_HEIGHT);
            drawWell();
            drawPiece(xp,yp, piece, rot);
        } else {
            ctx.font = '6px bold sans-serif';
            ctx.fillStyle = 'white';
            ctx.fillText('GAME', 0, 6);
            ctx.fillText('OVER', 0, 12);
        }
        flip();
        $('#lines').html(
            "Lines: " + lines.toString()
            + "<br>Points: " + points.toString()
            + (combo > 1 ? ("<br>Combo x" + combo + "!") : "")
            //+ (location.search == "?debug" ? "<br>t_spin: " + t_spin + " R: " + rotated + " K: " + kicked : "") 
            + (t_spin >= 1 ? ("<br><span class=\"bonus\">T-Spin"+ (t_spin > 1 ? " Bonus!!":"") +"!</span>") : "")
        );
        document.title = "Thptris "+ describeNext();
    }
    // gameloop
    function tick() {
        if (clearing) {
            // do nothing
        } else if (gameOver) {
            clearTimeout(timer); timer = 0;
        } else {
            // gravity
            drop();
        }
        redraw();
        timer = setTimeout(tick, TICK_DELAY);
    }
    $('body').keydown(function(event) {
        if (clearing) return;
        switch (event.which) {
            case 81: // q
                if (gameOver) return;
                rotate();
                redraw();
            break;
            case 69: // e
                if (gameOver) return;
                rotate(-1);
                redraw();
            break;
            case 37: // left arrow
                if (gameOver) return;
                if (event.which == 37 && event.shiftKey == true) {
                    rotate(1);
                    redraw();
                    break;
                }
            // fallthrough
            case 65: // a
                if (gameOver) return;
                left();
                redraw();
            break;
            case 83: case 40: // down / s
                if (gameOver) return;
                drop(true);
                redraw();
            break;
            case 39: // right arrow
                if (gameOver) return;
                if (event.which == 39 && event.shiftKey == true) {
                    rotate(-1);
                    redraw();
                    break;
                }
            // fallthrough
            case 68: // d
                if (gameOver) return;
                right();
                redraw();
            break;
            case 38: case 87: // up arrow / w
                if (gameOver) return;
                sonicDrop();
                redraw();
            break;
            case 78: // n
                newGame();
            break
            case 56: // sekret
                if (event.shiftKey) {
                    if (!$('canvas').is(':visible')) {
                        $('canvas').css({'width': '320px', 'display': 'block', 'image-rendering': 'pixelated'});
                    } else {
                        $('canvas').css({'width': '320px', 'display': 'none', 'image-rendering': 'pixelated'});
                    }
                }
            break;
        }
    });
    //if (location.search == "?debug") $('canvas').css({'width': '320px', 'display': 'block', 'image-rendering': 'pixelated'});
    tick();
});

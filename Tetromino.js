// templates for tetris
class Tetromino {
    constructor(_name, _color, _map) {
        this.name = _name;
        this.color = _color;
        this.maps = [];
        this.maps.push(_map);
        this.rebuildMaps();
    }
    _helperRotateCCW(array) {
        var out = [];
        var i, j;
        for (i = 0; i < array.length; i++) {
            var row = [];
            for (j = 0; j < array[i].length; j++) {
                row.push(0);
            }
            out.push(row);
        }
        for (i = 0; i < array.length; i++) {
            for (j = 0; j < array[i].length; j++) {
                out[i][j] = array[j][array.length - i - 1];
            }
        }
        return out;
    }
    _helperRotateCCW_2(array) {
        var out = [[0,0,0,0],
                   [0,0,0,0],
                   [0,0,0,0],
                   [0,0,0,0]];
        out[0][0] = array[0][3];
        out[0][1] = array[1][3];
        out[0][2] = array[2][3];
        out[0][3] = array[3][3];
        out[1][0] = array[0][2];
        out[1][1] = array[1][2];
        out[1][2] = array[2][2];
        out[1][3] = array[3][2];
        out[2][0] = array[0][1];
        out[2][1] = array[1][1];
        out[2][2] = array[2][1];
        out[2][3] = array[3][1];
        out[3][0] = array[0][0];
        out[3][1] = array[1][0];
        out[3][2] = array[2][0];
        out[3][3] = array[3][0];
        return out;
    }
    rebuildMaps() {
        var temp = this.maps[0];
        this.maps = [];
        this.maps.push(temp);
        for (var i = 0; i < 3; i++) {
            var rot = this._helperRotateCCW(this.maps[i]);
            this.maps.push(rot);
        }
        //console.log("built maps:");
        //console.log(this.toString());
    }
    toString() {
        var str = "";
        for (var i = 0; i < this.maps.length; i++) {
            var map = this.maps[i];
            str += map[0][0] + " " + map[0][1] + " " + map[0][2] + " " + map[0][3] + "\n";
            str += map[1][0] + " " + map[1][1] + " " + map[1][2] + " " + map[1][3] + "\n";
            str += map[2][0] + " " + map[2][1] + " " + map[2][2] + " " + map[2][3] + "\n";
            str += map[3][0] + " " + map[3][1] + " " + map[3][2] + " " + map[3][3] + "\n";
            str += "=====\n";
        }
        return str;
    }
};

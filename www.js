var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    dataBaseComunicator = require('./dataBaseComunicator');

app.listen(8080);

function handler (req, res) {
    fs.readFile(__dirname + '/index.html',function (err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
}

io.sockets.on('connection', function (socket) {
    console.log("new user");
    socket.on('getTable', function (tableName) {
        mydataBaseComunicator.dataBaseQuery(sqlSentence, function (value) {
            oldTable.initial(value);
            socket.emit('tableReturn', value);
        })
    });
});

var mydataBaseComunicator = new dataBaseComunicator();
function Table(){
    var table = new Map();
    var exist = new Map();
    this.initial = function(newtable){
        table.clear();
        exist.clear();
        newtable.forEach(function (row) {
            var key = row['EQUIPMENT_KEY'];
            table.set(key, row);
            exist.set(key, 0);
        });
        //console.log(table);
    };
    this.findDifference = function (newTable) {
        var toDelete = new Array();
        var toAdd = new Array();
        var count = 0;
        //console.log(table);
        //console.log(newTable);
        newTable.forEach(function (row) {
            var key = row['EQUIPMENT_KEY'];
            var flag = false;
            if(table.has(key)) {
                //console.log(key);
                exist.set(key, 1);
                var oldrow = table.get(key)
                for (var temp in oldrow) {
                    if (oldrow[temp] !== row[temp]) {
                        flag = true;
                        break;
                    }
                }
                if(flag === true){
                    console.log("modify");
                    console.log(row);
                    console.log(table.get(key));
                    toDelete.push(key);
                    toAdd.push({row:row ,rowNum:count});
                    //difference.push({isdelete:true, key:key});
                    //difference.push({isdelete:false, row:row ,rowNum:count})
                }
            }else{
                console.log("add");
                console.log(row);
                toAdd.push({row:row, rowNum:count});
                //difference.push({isdelete:false, row:row, rowNum:count});
            }
            count++;
        });
        console.log(exist);
        exist.forEach(function (value, key, mapObject) {
            if(value === 0) {
                console.log("delete");
                console.log(key, value);
                toDelete.push(key);
                //difference.push({isdelete: true, key: key});
            }
            exist.set(key, 0);
        });
        if(toAdd.length !== 0 || toDelete.length !== 0){
            console.log("updated");
            this.initial(newTable);
        }
        return {toDelete:toDelete, toAdd:toAdd};
    }
}
var oldTable = new Table();
var count = 1;
var sqlSentence =
    'select EMS_EQUIPMENTS.EQUIPMENT_KEY,EMS_EQUIPMENT_STATES.EQUIPMENT_STATE_NAME,EMS_EQUIPMENT_STATES.STATE_COLOR ' +
    'from EMS_EQUIPMENTS, EMS_EQUIPMENT_STATES ' +
    'where EMS_EQUIPMENTS.EQUIPMENT_STATE_KEY = EMS_EQUIPMENT_STATES.EQUIPMENT_STATE_KEY';
function mySchedule() {
    function myBoardcast(callback){  // 广播 //
        mydataBaseComunicator.dataBaseQuery(sqlSentence, function (newTable) {
            var difference = oldTable.findDifference(newTable);
            if(difference.toAdd.length > 0 || difference.toDelete.length > 0) {
                console.log(difference);
                io.sockets.emit('update', difference);
                //io.sockets.emit('tableReturn', newTable);
            }
        });
        count++;
        callback();
    }
    setTimeout(myBoardcast, 5000, mySchedule);
}
mySchedule();

var sql = require('mssql');
//配置
var config = {
    server: "127.0.0.1",
    database: "test",
    user: "sa",
    password: "Jft816279",
    port: 1434
};

function dataBaseComunicator() {
    var connection = null;
    this.dataBaseQuery = function(selectSentence, callback) {
        if(connection == null) {
            console.log("first connection");
            connection = sql.connect(config).then(function () {
                var request = new sql.Request();
                var result = request.query(selectSentence).catch(function (reason) {
                    console.log(reason)
                }).then(function (value) {
                        callback(value.recordsets[0]);
                    });
            });
        }else{
            console.log("no first connection");
            var request = new sql.Request();
            var result = request.query(selectSentence).catch(function (reason) {
                console.log(reason)
            }).then(function (value) {
                callback(value.recordsets[0]);
            });
        }
    };

}
module.exports = dataBaseComunicator;
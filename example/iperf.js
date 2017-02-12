var ps = require('../index');

var now = new Date().getTime();

var host = "chic-pt1.es.net";
ps.ma.endpoint({host: host}, function(err, endpoints) {
    console.dir(endpoints);
    if(err) throw err;
    ps.ma.iperf({
        host: host,
        starttime: now - 3600*1000*24*90,
        endpoints: [ endpoints.iperf[0] ]
    }, function(err, data) {
        if(err) throw err;
        console.log(JSON.stringify(data, null, 2));
    });
});


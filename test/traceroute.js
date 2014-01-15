
var ps = require('../index');
var now = new Date();
var host = "perfsonar-2.t2.ucsd.edu";

ps.ma.endpoint({host: host}, function(err, endpoints) {
    ps.ma.traceroute({host: host, endpoints: [ endpoints.traceroute[0]]}, function(err, results) {
        console.log(JSON.stringify(results, undefined, 2));
    });
});


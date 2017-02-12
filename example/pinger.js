var ps = require('../index');

var host = "perfsonar01.cmsaf.mit.edu";
ps.ma.endpoint({host: host}, function(err, endpoints) {
    ps.ma.pinger({
        host: host,
        endpoints: [ endpoints.pinger[0], endpoints.pinger[1] ]
    }, function(err, results) {
        if(err) throw err;
        results.forEach(function(result) {
            console.dir(result);
        });
    });
});


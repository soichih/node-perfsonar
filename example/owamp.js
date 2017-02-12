var ps = require('../index');

ps.ma.endpoint({host: "perfsonar-2.t2.ucsd.edu"}, function(err, endpoints) {
    if(err) throw err;
    ps.ma.owamp({
        host: "perfsonar-2.t2.ucsd.edu", 
        endpoints: [endpoints.owamp[0]]//just pick one from the list
    }, function(err, data) {
        if(err) throw err;
        console.dir(data[0].endpoint); 
        console.dir(data[0].data); 
    });
});


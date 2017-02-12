
var ps = require('../index');

ps.ma.endpoint({server: "ps-development.bnl.gov", debug: true}, function(err, endpoints) {
    if(err) throw err;
    console.log(JSON.stringify(endpoints, null, 2));
});


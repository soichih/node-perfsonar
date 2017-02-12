var ps = require('../index');
ps.hostinfo("perfsonar-2.t2.ucsd.edu", function(err, info) {
    if(err) throw err;
    console.log(JSON.stringify(info, null, 2));
});


const request = require('request');

//Lookup Service API
exports.hello = () => {
    console.log("hello");
}

exports.global = {
    gethosts: (cb) => {
        request.get({url: "http://ps1.es.net:8096/lookup/activehosts.json", json: true}, 
        function(err, res, body) {
            if(err) return cb(err);
            var hosts = [];
            body.hosts.forEach((host)=>{
                if(host.status == "alive") hosts.push(host.locator);
            });
            cb(null, hosts);
        });
    }
}

exports.query = (url, query, cb)=>{
    request.get({url: url, qs: query, json: true}, 
    function(err, res, body) {
        if(err) return cb(err);
        cb(null, body);
    });
}

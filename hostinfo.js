
var http = require('http');
var htmlp = require('html-parser');

exports.hostinfo = function(host, callback) {
    var options = {
        host: host,
        port: 80,
        path: '/toolkit/',
        method: 'GET',
    };
    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        var html = "";
        res.on('data', function(chunk) {
            html += chunk;
        });
        res.on('end', function() {
            if(res.statusCode == 200) {
                var next = null;
                var info = {};
                htmlp.parse(html, {
                    text: function(value) {
                        if(next !== null) {
                            info[next] = value;
                            next = null;
                        } else {
                            if(value == "Latitude,Longitude") {
                                next = "latlng";
                            } else if(value == "Administrator Name") {
                                next = "admin_name";
                            } else if(value == "Zip Code") {
                                next = "zipcode";
                            } else if(value == "City, State, Country") {
                                next = "address";
                            } else if(value == "Organization Name") {
                                next = "org_name";
                            } else if(value == "Administrator Email") {
                                next = "admin_email";
                            } else {
                                next = null;
                            }
                        }
                    },
                    closeElement: function(name) {
                        if(name == "html") {
                            if(info.latlng !== undefined) {
                                var ll = info.latlng.split(",");
                                if(ll.length == 2) {
                                    info.latitude = parseFloat(ll[0]);
                                    info.longitude = parseFloat(ll[1]);
                                    if(isNaN(info.latitude)) {
                                        delete info.latitude;
                                        delete info.longitude;
                                    }
                                }
                                delete info.latlng;
                            }
                            callback(null, info);
                        }
                    }
                });
            } else {
                callback(new Error(host + " returned code : "+res.statusCode));
            }
        });
    });
    req.setTimeout(10000, function() { //10 seconds too short?
        req.abort();
    });
    req.on('error', function(e) {
        callback(e, null);
    });
    req.end();
};



exports.ma = require('./ma.js');

var scum = require('./scum');
var merge = require('merge');
var async = require('async');
var xmlstream = require('xml-stream');

var now = new Date();

exports.echo = function(options, callback) {
    var default_options = {
        server: "atlas-owamp.bu.edu",
        port: 8085,
        path: "/perfSONAR_PS/services/pSB",
        starttime: now.getTime() - 3600*1000*3,
        endtime: now.getTime()
    };
    var options = merge(default_options, options);
    var request_options = {
        host: options.server,
        port: options.port,
        path: options.path,
        debug: false 
    };
    var body = scum.render("echo.ejs");
    scum.post_and_parse(body, request_options, function(err, body){
        if(err) throw err;
        var data = body[0]["nmwg:message"][0]['nmwg:data'];
        var msg = data[0]["nmwgr:datum"][0]['_'];
        callback(null, msg);
    });
};

//list all endpoints from various services
exports.endpoints = function(options, callback) {
    async.parallel({
        iperf: function(next) {
            exports.endpoints_iperf(options, next);
        },
        owamp: function(next) {
            exports.endpoints_owamp(options, next);
        },
        pinger: function(next) {
            exports.endpoints_pinger(options, next);
        },
        traceroute: function(next) {
            exports.endpoints_traceroute(options, next);
        }
    }, callback);
};

exports.endpoints_iperf = function(options, callback) {
    var default_options = {
        server: "atlas-owamp.bu.edu",
        port: 8085,
        path: "/perfSONAR_PS/services/pSB",
        starttime: now.getTime() - 3600*1000*3,
        endtime: now.getTime()
    };
    var options = merge(default_options, options);
    var request_options = {
        host: options.server,
        port: options.port,
        path: options.path,
        debug: false
    };
    var body = scum.render("iperf_endpoints.ejs");
    scum.post_and_parse(body, request_options, function(err, body){
        var endpoints = [];
        if(err) {
            callback(null, null); //return empty list
            return;
        }
        try {
            try {
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                var msg = data[0]["nmwgr:datum"][0]['_'];
                //console.log("perfsonar.endpoints_iperf :: "+options.server+" "+msg);
                callback(null, null);
            } catch(err) {
                var data = body[0]["nmwg:message"][0]['nmwg:metadata'];
                data.forEach(function(item) {
                    var endpoint;
                    //var id = item['$']['id'];
                    var entry = item['iperf:subject'][0]['nmwgt:endPointPair'][0];
                    endpoint = {
                        src_type: entry['nmwgt:src'][0]['$']['type'],
                        src: entry['nmwgt:src'][0]['$']['value'],
                        dst_type: entry['nmwgt:dst'][0]['$']['type'],
                        dst: entry['nmwgt:dst'][0]['$']['value'],
                        protocol: item['nmwg:parameters'][0]['nmwg:parameter'][0]['_'],
                        duration: parseInt(item['nmwg:parameters'][0]['nmwg:parameter'][1]['_'])
                    }
                    endpoints.push(endpoint);
                });
                callback(null, endpoints);
            }
        } catch(err) {
            console.dir(err);
            callback(err, null);
        }
    });
};

exports.endpoints_owamp = function(options, callback) {
    var default_options = {
        server: "atlas-owamp.bu.edu",
        port: 8085,
        path: "/perfSONAR_PS/services/pSB",
        starttime: now.getTime() - 3600*1000*3,
        endtime: now.getTime()
    };
    var options = merge(default_options, options);
    var request_options = {
        host: options.server,
        port: options.port,
        path: options.path,
        debug: false
    };
    var body = scum.render("owamp_endpoints.ejs");
    scum.post_and_parse(body, request_options, function(err, body){
        var endpoints = [];
        if(err) {
            callback(null, null); //return empty list
            return;
        }
        try {
            try {
                //see if we have message
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                var msg = data[0]["nmwgr:datum"][0]['_'];
                //console.log("perfsonar.endpoints_owamp :: "+options.server+" "+msg);
                callback(null, null);
            } catch(err) {
                var data = body[0]["nmwg:message"][0]['nmwg:metadata'];
                data.forEach(function(item) {
                    var endpoint;
                    //var id = item['$']['id'];
                    var entry = item['owamp:subject'][0]['nmwgt:endPointPair'][0];
                    endpoint = {
                        src_type: entry['nmwgt:src'][0]['$']['type'],
                        src: entry['nmwgt:src'][0]['$']['value'],
                        dst_type: entry['nmwgt:dst'][0]['$']['type'],
                        dst: entry['nmwgt:dst'][0]['$']['value'],
                        count: parseInt(item['nmwg:parameters'][0]['nmwg:parameter'][0]['_']),
                        bucket_width: parseFloat(item['nmwg:parameters'][0]['nmwg:parameter'][1]['_']),
                        schedule: [ { 
                            interval: item['nmwg:parameters'][0]['nmwg:parameter'][2]['interval'][0]['_'],
                            type: item['nmwg:parameters'][0]['nmwg:parameter'][2]['interval'][0]['$']['type'] }
                        ]
                    }
                    //endpoints[id] = endpoint;
                    endpoints.push(endpoint);
                });
                callback(null, endpoints);
            }
        } catch(err) {
            console.dir(err);
            callback(err, null);
        }
    });
};

exports.endpoints_pinger = function(options, callback) {
    var options = merge({
        server: "web100.maxgigapop.net",
        port: 8075,
        path: "/perfSONAR_PS/services/pinger/ma"
    }, options);
    var request_options = {
        host: options.server,
        port: options.port,
        path: options.path,
        debug: false 
    };
    var body = scum.render("pinger_endpoints.ejs");
    scum.post_and_parse(body, request_options, function(err, body){
        if(err) {
            //post error.. could be a real issue, but could also happen if server is not supporting pinger
            //for now, let's return empty list
            callback(null, null); //return empty list
            return;
        }
        try {
            try {
                //see if we have message
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                var msg = data[0]["nmwgr:datum"][0]['_'];
                //console.log("perfsonar.endpoints_pinger :: "+options.server+" "+msg);
                callback(null, null);
            } catch(err) {
                //parse metadata
                var end_and_datas = {};  //used to put data once it's found
                var metadata = body[0]["nmwg:message"][0]['nmwg:metadata'];
                var endpoints = [];
                metadata.forEach(function(item) {
                    var subject = item['pinger:subject'][0];

                    //what are these things for?
                    //var subject_id = subject['$']['id'];
                    //var parameters_id = item['pinger:parameters'][0]['$']['id'];
                    //var key = item['nmwg:key'][0]['$']['id'][0];

                    var mid = item['$']['id'];
                    var endpoint = {
                        src_type: subject['nmwgt:endPointPair'][0]['nmwgt:src'][0]['$']['type'],
                        src: subject['nmwgt:endPointPair'][0]['nmwgt:src'][0]['$']['value'],
                        dst_type: subject['nmwgt:endPointPair'][0]['nmwgt:dst'][0]['$']['type'],
                        dst: subject['nmwgt:endPointPair'][0]['nmwgt:dst'][0]['$']['value'],
                        _datakeys: []
                    };

                    //parse parameters
                    var parameters = item['pinger:parameters'][0]['nmwg:parameter'];
                    parameters.forEach(function(param) {
                        var name = param['$']['name'];
                        var value = param['$']['value'];
                        //cast
                        switch(name) {
                        case "count":
                        case "packetSize":
                        case "ttl":
                        case "packetInterval":
                            value = parseInt(value);
                            break;
                        }
                        /*
                        //rename
                        switch(name) {
                        case "packetSize": name = "packet_size"; break;
                        case "packetInterval": name = "packet_interval"; break;
                        }
                        */
                        endpoint[name] = value;
                    });
                    endpoints.push(endpoint);
                    end_and_datas[mid] = endpoint;
                });

                //parse data
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                data.forEach(function(item) {
                    var mid = item['$']['metadataIdRef'];
                    var datakey = item['nmwg:key'][0]['$']['id'];
                    var ead = end_and_datas[mid];
                    ead._datakeys.push(datakey);
                });

                //merge similar endpoints 
                var m_endpoints = {};
                endpoints.forEach(function(endpoint) {
                    var eid = endpoint.src+":"+endpoint.dst+":"+endpoint.packetSize;
                    if(m_endpoints[eid] === undefined) {
                        m_endpoints[eid] = endpoint;
                    } else {
                        m_endpoints[eid]._datakeys = m_endpoints[eid]._datakeys.concat(endpoint._datakeys);
                    }
                });
            
                //finally, strip eid keys and turn it into an array
                var m_endpoints_a = [];
                for(var e in m_endpoints) {
                    m_endpoints_a.push(m_endpoints[e]);
                }
                callback(null, m_endpoints_a);
            }
        } catch(err) {
            console.dir(err);
            callback(err, null);
        }
    });
}

exports.endpoints_traceroute = function(options, callback) {
    var options = merge({
        server: "perfsonar-2.t2.ucsd.edu",
        port: 8086,
        path: "/perfSONAR_PS/services/tracerouteMA"
    }, options);
    var request_options = {
        host: options.server,
        port: options.port,
        path: options.path,
        debug: false
    };
    var body = scum.render("traceroute_endpoints.ejs");
    //console.dir(body);
    scum.post_and_parse(body, request_options, function(err, body){
        //console.log(JSON.stringify(body));
        if(err) {
            //post error.. could be a real issue, but could also happen if server is not supporting pinger
            //for now, let's return empty list
            callback(null, null); //return empty list
            return;
        }
        try {
            try {
                //see if we have message
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                var msg = data[0]["nmwgr:datum"][0]['_'];
                //console.log("perfsonar.endpoints_pinger :: "+options.server+" "+msg);
                callback(null, null);
            } catch(err) {
                var endpoints = [];
                var data = body[0]["nmwg:message"][0]['nmwg:metadata'];
                data.forEach(function(item) {
                    var endpoint;
                    //var id = item['$']['id'];
                    var entry = item['traceroute:subject'][0]['nmwgt:endPointPair'][0];
                    var subjectid = item['traceroute:subject'][0]['$']['id'];
                    //var mid = subjectid.substring(5,subjectid.length);
                    endpoint = {
                        src_type: entry['nmwgt:src'][0]['$']['type'],
                        src: entry['nmwgt:src'][0]['$']['value'],
                        dst_type: entry['nmwgt:dst'][0]['$']['type'],
                        dst: entry['nmwgt:dst'][0]['$']['value']
                        //_mid: mid
                    }
                    endpoints.push(endpoint);
                });
                callback(null, endpoints);
            }
        } catch(err) {
            console.dir(err);
            callback(err, null);
        }
    });
}


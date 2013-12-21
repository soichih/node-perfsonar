
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
        starttime: Math.floor(now.getTime()) - 3600*1000*3,
        endtime: Math.floor(now.getTime())
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
        }
    }, callback);
};

exports.endpoints_iperf = function(options, callback) {
    var default_options = {
        server: "atlas-owamp.bu.edu",
        port: 8085,
        path: "/perfSONAR_PS/services/pSB",
        starttime: Math.floor(now.getTime()) - 3600*1000*3,
        endtime: Math.floor(now.getTime())
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
            callback(null, endpoints); //return empty list
            return;
        }
        try {
            try {
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                var msg = data[0]["nmwgr:datum"][0]['_'];
                //console.log("perfsonar.endpoints_iperf :: "+options.server+" "+msg);
                callback(null, endpoints);
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
        starttime: Math.floor(now.getTime()) - 3600*1000*3,
        endtime: Math.floor(now.getTime())
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
            callback(null, endpoints); //return empty list
            return;
        }
        try {
            try {
                //see if we have message
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                var msg = data[0]["nmwgr:datum"][0]['_'];
                //console.log("perfsonar.endpoints_owamp :: "+options.server+" "+msg);
                callback(null, endpoints);
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
            callback(null, []); //return empty list
            return;
        }
        try {
            try {
                //see if we have message
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                var msg = data[0]["nmwgr:datum"][0]['_'];
                //console.log("perfsonar.endpoints_pinger :: "+options.server+" "+msg);
                callback(null, []);
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

//pull iperf restuls
exports.iperf = function(options, callback) {
    var default_options = {
        server: "atlas-owamp.bu.edu",
        port: 8085,
        path: "/perfSONAR_PS/services/pSB",
        starttime: Math.floor(now.getTime()) - 3600*1000*3,
        endtime: Math.floor(now.getTime()),
        debug: false 
    };
    var options = merge(default_options, options);
    var body;
    if(options.endpoints == undefined) {
        body = scum.render("iperf_madata_all.ejs", options);
    } else {
        body = scum.render("iperf_madata.ejs", options);
    }
    var request_options = {
        host: options.server,
        port: options.port,
        path: options.path,
        debug: false
    };
    //console.log(body);
    scum.post_and_parse(body, request_options, function(err, body){
        if(err) throw err;
        try {
            var all_results = [];
            try {
                //any message from server?
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                var msg = data[0]["nmwgr:datum"][0]['_'];
                console.log("perfsonar.iperf :: "+options.server+" "+msg);
                callback(null, all_results);
            } catch(err) {
                //parse metadata
                var data = body[0]["nmwg:message"][0]['nmwg:metadata'];
                var endpoints = {};
                data.forEach(function(item) {
                    var endpoint;
                    var id = item['$']['id'];
                    var entry = item['iperf:subject'][0]['nmwgt:endPointPair'][0];
                    endpoint = {
                        src_type: entry['nmwgt:src'][0]['$']['type'],
                        src: entry['nmwgt:src'][0]['$']['value'],
                        dst_type: entry['nmwgt:dst'][0]['$']['type'],
                        dst: entry['nmwgt:dst'][0]['$']['value'],
                        protocol: item['nmwg:parameters'][0]['nmwg:parameter'][0]['_'],
                        duration: parseInt(item['nmwg:parameters'][0]['nmwg:parameter'][1]['_'])
                    }
                    endpoints[id] = endpoint;
                });

                //parse data
                var datas = body[0]["nmwg:message"][0]['nmwg:data'];
                datas.forEach(function(data) {
                    var refid = data['$']['metadataIdRef'];
                    var results = [];
                    data = data['iperf:datum'];
                    if(data !== undefined) {
                        data.forEach(function(item) {
                            if(item['_'] !== undefined) {
                                //probably 'Query returned 0 results'
                            } else {
                                var item = item['$'];
                                //console.dir(item);
                                results.push({
                                    time: Date.parse(item.timeValue), 
                                    throughput: parseFloat(item.throughput)
                                });
                            }
                        });
                    }
                    all_results.push({endpoint: endpoints[refid], data: results});
                });
                callback(null, all_results);
            }
        } catch(err) {
            console.dir(err);
            callback(err, null);
        }
    });
};

//pull owamp restuls
exports.owamp = function(options, callback) {
    var default_options = {
        server: "atlas-owamp.bu.edu",
        port: 8085,
        path: "/perfSONAR_PS/services/pSB",
        starttime: Math.floor(now.getTime()) - 3600*1000*3,
        endtime: Math.floor(now.getTime())
    };
    var options = merge(default_options, options);
    var body;
    if(options.endpoints == undefined) {
        body = scum.render("owamp_madata_all.ejs", options);
    } else {
        body = scum.render("owamp_madata.ejs", options);
    }
    var request_options = {
        host: options.server,
        port: options.port,
        path: options.path,
        debug: false
    };
    //console.log(body);
    scum.post_and_parse(body, request_options, function(err, body){
        if(err) throw err;
        try {
            var all_results = [];
            try {
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                var msg = data[0]["nmwgr:datum"][0]['_'];
                console.log("perfsonar.owamp:: "+options.server+" "+msg);
                callback(null, all_results);
            } catch(err) {
                //parse metadata
                var data = body[0]["nmwg:message"][0]['nmwg:metadata'];
                var endpoints = {};
                data.forEach(function(item) {
                    var endpoint;
                    var id = item['$']['id'];
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
                    endpoints[id] = endpoint;
                });

                //parse data
                var datas = body[0]["nmwg:message"][0]['nmwg:data'];
                datas.forEach(function(data) {
                    var refid = data['$']['metadataIdRef'];
                    var results = [];
                    data = data['summary:datum'];
                    if(data !== undefined) {
                        data.forEach(function(item) {
                            if(item['_'] !== undefined) {
                                //probably 'Query returned 0 results'
                            } else {
                                var item = item['$'];
                                //console.dir(item);
                                results.push({
                                    start_time: Date.parse(item.startTime), 
                                    end_time: Date.parse(item.endTime), 
                                    min_ttl: parseInt(item.minTTL),
                                    max_ttl: parseInt(item.maxTTL),
                                    min_delay: parseFloat(item.min_delay),
                                    max_delay: parseFloat(item.max_delay),
                                    //min_error: parseFloat(item.minError), //no such thing?
                                    max_error: parseFloat(item.maxError),
                                    duplicates: parseInt(item.duplicates),
                                    sent: parseInt(item.sent),
                                    loss: parseInt(item.loss)
                                });
                            }
                        });
                    }
                    all_results.push({endpoint: endpoints[refid], data: results});
                });
                callback(null, all_results);
            }
        } catch(err) {
            console.dir(err);
            callback(err, null);
        }
    });
};

//set options.endpoint with list of endpoints obtained from endpoints_pinger()
//so that it has _datakeys array.
exports.pinger = function(options, callback) {
    var options = merge({
        server: "web100.maxgigapop.net",
        port: 8075,
        path: "/perfSONAR_PS/services/pinger/ma",
        starttime: Math.floor(now.getTime()) - 1800*5*1000,
        endtime: Math.floor(now.getTime()),
        resolution: 5,
        consolidation_function: "AVERAGE"
    }, options);
    var request_options = {
        host: options.server,
        port: options.port,
        path: options.path,
        debug: false
    };

    if(options.endpoints === undefined) {
        //we need to pull the entire endpoints
        exports.endpoints_pinger(options, function(err, endpoints) {
            if(err) throw err;
            options.endpoints = endpoints;
            exports.pinger(options, callback);
        });
    } else {
        //endpoint provided.. is it an array?
        if(!Array.isArray(options.endpoints)) {
            options.endpoints = [options.endpoints];
        }

        var key_to_endpoints = {}; //mapping used to map result data back to endpoint
        options._keys = [];

        //make sure all endpoints contains _datakeys
        options.endpoints.forEach(function(endpoint) {
            if(endpoint._datakeys === undefined) {
                //TODO - automatically load the _datakeys.. in the future.
                throw new Error("Please use endpoint obtained via endpoints_pinger()..");
            }
            options._keys = options._keys.concat(endpoint._datakeys);

            //remember when key belongs to which endpoint
            endpoint._datakeys.forEach(function(key) {
                key_to_endpoints[key] = endpoint;
            });
        });

        /*
        var body = scum.render("pinger_madata.fixed.ejs", options);
        scum.post_and_parse(body, request_options, function(res){
            callback(null, res);
        });
        */

        var body = scum.render("pinger_madata.ejs", options);
        //console.log(body);
        var debug_body = "";
        scum.post(body, request_options, function(res){
            res.setEncoding('utf8');
            var xml = new xmlstream(res);
            var meta1, meta2, data;
            var commontimes;
            var commontime;
            var pinger_params;
            var results = {};

            res.on('data', function (chunk) {
                debug_body += chunk;
            });

            xml.on('endElement: nmwg:metadata', function(mdata) {
                if(mdata['$']['id'] == "meta1") {
                    meta1 = mdata;
                } else if(mdata['$']['id'] == "meta2") {
                    meta2 = mdata;
                }
            });
            xml.on('startElement: nmwg:data', function(data) {
                commontimes = [];
            });
            xml.on('startElement: nmwg:commonTime', function(data) {
                commontime = {};
            });
            xml.on('endElement: pinger:datum', function(data) {
                var key = data['$']['name'];
                var value = parseFloat(data['$']['value']);
                commontime[key] = value;
            });
            xml.on('endElement: nmwg:commonTime', function(data) {
                commontime.time = parseInt(data['$']['value'])*1000;
                commontimes.push(commontime);
            });
            xml.on('startElement: pinger:parameters', function(data) {
                pinger_params = {};
            });
            xml.on('endElement: pinger:parameters > nmwg:parameter', function(data) {
                var key = data['$']['name'];
                var value = data['$']['value'];
                pinger_params[key] = value;
            });
            xml.on('endElement: nmwg:data', function(data) {
                if(data['nmwg:commonTime'] !== undefined) {
                    //endpoint = meta2['pinger:subject']['nmwgt:endPointPair'];
                    
                    //for whatever the reason, key could be stored in either meta1 or meta2
                    /*
                    if(meta2['nmwg::key'] !== undefined) {
                    } else {
                        console.dir(meta1['nmwg::key']);
                        key = meta1['nmwg::key']['$']['id'];
                    }
                    */
                    var key = meta2['nmwg:key']['$']['id'];
                    /*
                    results[key] = {endpoint: {
                        src_type: endpoint['nmwgt:src']['$']['type'],
                        src: endpoint['nmwgt:src']['$']['value'],
                        dst_type: endpoint['nmwgt:dst']['$']['type'],
                        dst: endpoint['nmwgt:dst']['$']['value'],
                        packetSize: parseInt(pinger_params.packetSize),
                        _key: meta2['nmwg:key']['$']['id']
                    }, data: commontimes};
                    */
                    results[key] = commontimes;
                } else {
                    //missing
                    /*
                    console.dir(meta1);
                    var key = meta1['nmwg:key']['$']['id'];
                    results[key] = "missing";
                    */
                }
            });
            xml.on('end', function() {
                //console.log(debug_body);
                var final_results = options.endpoints; //should I clone it?
                final_results.forEach(function(result) {
                    result.data = [];
                    result._datakeys.forEach(function(key) {
                        if(results[key] !== undefined) {
                            result.data = result.data.concat(results[key]);
                        }
                    });
                });
                callback(null, final_results);
            });
        });
    }
}


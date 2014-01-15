
var scum = require('./scum');
var merge = require('merge');
var async = require('async');
var xmlstream = require('xml-stream');
var http = require('http');
var htmlp = require('html-parser');
var net = require('net');

var now = new Date();

function setaddrtype(endpoints) {
    endpoints.forEach(function(endpoint) {
        if(net.isIPv4(endpoint.src)) {
            endpoint.src_type = "ipv4";
        } else if(net.isIPv6(endpoint.src)) {
            endpoint.src_type = "ipv6";
        } else {
            endpoint.src_type = "hostname";
        }
        if(net.isIPv4(endpoint.dst)) {
            endpoint.dst_type = "ipv4";
        } else if(net.isIPv6(endpoint.dst)) {
            endpoint.dst_type = "ipv6";
        } else {
            endpoint.dst_type = "hostname";
        }
    });
}

function parse_params(params) {
    var ps = {};
    params.forEach(function(param) {
        if(param._) {
            ps[param.$.name] = param._;
        } else {
            //find the key containing complex object and put raw object..
            for(var key in param) {
                if(key != '$') {
                    ps[param.$.name] = param[key];
                }
            }
        }
    }); 
    //console.dir(ps);
    return ps;
}

exports.echo = function(options, callback) {
    var default_options = {
        host: "atlas-owamp.bu.edu",
        port: 8085,
        path: "/perfSONAR_PS/services/pSB",
        starttime: now.getTime() - 3600*1000*3,
        endtime: now.getTime(),
        debug: false 
    };
    var options = merge(default_options, options);
    var request_options = {
        host: options.host,
        port: options.port,
        path: options.path,
        debug: options.debug
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
exports.endpoint = function(options, callback) {
    async.parallel({
        iperf: function(next) {
            exports.endpoint_iperf(options, next);
        },
        owamp: function(next) {
            exports.endpoint_owamp(options, next);
        },
        pinger: function(next) {
            exports.endpoint_pinger(options, next);
        },
        traceroute: function(next) {
            exports.endpoint_traceroute(options, next);
        }
    }, callback);
};

exports.endpoint_iperf = function(options, callback) {
    var default_options = {
        host: "atlas-owamp.bu.edu",
        port: 8085,
        path: "/perfSONAR_PS/services/pSB",
        starttime: now.getTime() - 3600*1000*3,
        endtime: now.getTime(),
        debug: false
    };
    var options = merge(default_options, options);
    var request_options = {
        host: options.host,
        port: options.port,
        path: options.path,
        debug: options.debug
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
                callback(null, null);
            } catch(err) {
                var data = body[0]["nmwg:message"][0]['nmwg:metadata'];
                data.forEach(function(item) {
                    var endpoint;
                    var entry = item['iperf:subject'][0]['nmwgt:endPointPair'][0];
                    endpoint = {
                        //src_type: entry['nmwgt:src'][0]['$']['type'],
                        src: entry['nmwgt:src'][0]['$']['value'],
                        //dst_type: entry['nmwgt:dst'][0]['$']['type'],
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

exports.endpoint_owamp = function(options, callback) {
    var default_options = {
        host: "atlas-owamp.bu.edu",
        port: 8085,
        path: "/perfSONAR_PS/services/pSB",
        starttime: now.getTime() - 3600*1000*3,
        endtime: now.getTime(),
        debug: false
    };
    var options = merge(default_options, options);
    var request_options = {
        host: options.host,
        port: options.port,
        path: options.path,
        debug: options.debug
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
                callback(null, null);
            } catch(err) {
                var data = body[0]["nmwg:message"][0]['nmwg:metadata'];
                data.forEach(function(item) {
                    var endpoint;
                    //var id = item['$']['id'];
                    var entry = item['owamp:subject'][0]['nmwgt:endPointPair'][0];
                    var params = parse_params(item['nmwg:parameters'][0]['nmwg:parameter']);
                    var interval = parseFloat(params.schedule[0]._);
                    var interval_type = params.schedule[0].$.type;

                    //sometimes dst is missing
                    if(entry['nmwgt:src'][0]['$'] == undefined) return;
                    if(entry['nmwgt:dst'][0]['$'] == undefined) return;

                    endpoint = {
                        src: entry['nmwgt:src'][0]['$']['value'],
                        dst: entry['nmwgt:dst'][0]['$']['value'],
                        count: parseInt(params.count),
                        bucket_width: parseFloat(params.bucket_width),
                        packet_padding: parseInt(params.packet_padding),
                        schedule: {interval: interval, interval_type: interval_type}
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

exports.endpoint_pinger = function(options, callback) {
    var options = merge({
        host: "web100.maxgigapop.net",
        port: 8075,
        path: "/perfSONAR_PS/services/pinger/ma",
        debug: false
    }, options);
    var request_options = {
        host: options.host,
        port: options.port,
        path: options.path,
        debug: options.debug
    };
    var body = scum.render("pinger_endpoints.ejs");
    scum.post_and_parse(body, request_options, function(err, body){
        if(err) {
            //post error.. could be a real issue, but could also happen if host is not supporting pinger or timeout
            callback(null, null); //return empty list
            return;
        }
        try {
            try {
                //see if we have message
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                var msg = data[0]["nmwgr:datum"][0]['_'];
                callback(null, null);
            } catch(err) {
                //parse metadata
                var end_and_datas = {};  //used to put data once it's found
                var metadata = body[0]["nmwg:message"][0]['nmwg:metadata'];
                var endpoints = [];
                metadata.forEach(function(item) {
                    var subject = item['pinger:subject'][0];

                    var mid = item['$']['id'];
                    var endpoint = {
                        src: subject['nmwgt:endPointPair'][0]['nmwgt:src'][0]['$']['value'],
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

exports.endpoint_traceroute = function(options, callback) {
    var options = merge({
        host: "perfsonar-2.t2.ucsd.edu",
        port: 8086,
        path: "/perfSONAR_PS/services/tracerouteMA",
        debug: false 
    }, options);
    var request_options = {
        host: options.host,
        port: options.port,
        path: options.path,
        debug: options.debug
    };
    var body = scum.render("traceroute_endpoints.ejs");
    //console.dir(body);
    scum.post_and_parse(body, request_options, function(err, body){
        //console.log(JSON.stringify(body));
        if(err) {
            //post error.. could be a real issue, but could also happen if host is not supporting pinger
            //for now, let's return empty list
            callback(null, null); //return empty list
            return;
        }
        try {
            try {
                //see if we have message
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                var msg = data[0]["nmwgr:datum"][0]['_'];
                callback(null, null);
            } catch(err) {
                var endpoints = [];
                var data = body[0]["nmwg:message"][0]['nmwg:metadata'];
                data.forEach(function(item) {
                    var endpoint;
                    //var id = item['$']['id'];
                    var entry = item['traceroute:subject'][0]['nmwgt:endPointPair'][0];
                    var subjectid = item['traceroute:subject'][0]['$']['id'];
                    endpoint = {
                        src: entry['nmwgt:src'][0]['$']['value'],
                        dst: entry['nmwgt:dst'][0]['$']['value']
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

//pull iperf restuls
exports.iperf = function(options, callback) {
    var default_options = {
        host: "atlas-owamp.bu.edu",
        port: 8085,
        path: "/perfSONAR_PS/services/pSB",
        starttime: now.getTime() - 3600*1000*5,
        endtime: now.getTime(),
        debug: false 
    };
    var options = merge(default_options, options);
    var body;
    if(options.endpoints == undefined) {
        body = scum.render("iperf_madata_all.ejs", options);
    } else {
        setaddrtype(options.endpoints);
        body = scum.render("iperf_madata.ejs", options);
    }
    var request_options = {
        host: options.host,
        port: options.port,
        path: options.path,
        debug: options.debug
    };
    scum.post_and_parse(body, request_options, function(err, body){
        if(err) throw err;
        try {
            var all_results = [];
            try {
                //any message from host?
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                var msg = data[0]["nmwgr:datum"][0]['_'];
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
                        src: entry['nmwgt:src'][0]['$']['value'],
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
        host: "atlas-owamp.bu.edu",
        port: 8085,
        path: "/perfSONAR_PS/services/pSB",
        starttime: now.getTime() - 3600*1000*3,
        endtime: now.getTime(),
        debug: false
    };
    var options = merge(default_options, options);
    var body;
    if(options.endpoints == undefined) {
        body = scum.render("owamp_madata_all.ejs", options);
    } else {
        setaddrtype(options.endpoints);
        body = scum.render("owamp_madata.ejs", options);
    }
    var request_options = {
        host: options.host,
        port: options.port,
        path: options.path,
        debug: options.debug
    };
    scum.post_and_parse(body, request_options, function(err, body){
        if(err) throw err;
        try {
            var all_results = [];
            try {
                var data = body[0]["nmwg:message"][0]['nmwg:data'];
                var msg = data[0]["nmwgr:datum"][0]['_'];
                console.log("perfsonar.owamp:: "+options.host+" "+msg);
                callback(null, all_results);
            } catch(err) {
                //parse metadata
                var data = body[0]["nmwg:message"][0]['nmwg:metadata'];
                var endpoints = {};
                data.forEach(function(item) {
                    var id = item['$']['id'];
                    var entry = item['owamp:subject'][0]['nmwgt:endPointPair'][0];
                    var params = parse_params(item['nmwg:parameters'][0]['nmwg:parameter']);
                    var interval = parseFloat(params.schedule[0]._);
                    var interval_type = params.schedule[0].$.type;

                    //sometimes dst is missing
                    if(entry['nmwgt:src'][0]['$'] == undefined) return;
                    if(entry['nmwgt:dst'][0]['$'] == undefined) return;

                    var endpoint = {
                        src: entry['nmwgt:src'][0]['$']['value'],
                        dst: entry['nmwgt:dst'][0]['$']['value'],
                        count: parseInt(params.count),
                        bucket_width: parseFloat(params.bucket_width),
                        packet_padding: parseInt(params.packet_padding),
                        schedule: {interval: interval, interval_type: interval_type}
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

exports.traceroute = function(options, callback) {
    var default_options = {
        host: "perfsonar-2.t2.ucsd.edu",
        port: 8086,
        path: "/perfSONAR_PS/services/tracerouteMA",
        starttime: now.getTime() - 3600*1000*24, 
        endtime: now.getTime(),
        debug: false
    };
    var options = merge(default_options, options);
    var body;
    if(options.endpoints == undefined) {
        //body = scum.render("traceroute_madata_all.ejs", options);
        throw new Error("please specify endpoints");
    } else {
        setaddrtype(options.endpoints);
        body = scum.render("traceroute_madata.ejs", options);
    }
    var request_options = {
        host: options.host,
        port: options.port,
        path: options.path,
        debug: options.debug
    };
    //console.log(body);
    scum.post(body, request_options, function(err, res){
        if(err) {
            console.log("scum.post failed");
            console.dir(request_options);
            callback(err);
            return;
        }
        res.setEncoding('utf8');
        var xml = new xmlstream(res);
        var endpoint, routes, result = null, results = [], time, valueunit, maxttl;

        var debug_xml = "";
        if(request_options.debug) { 
            res.on('data', function (chunk) {
                debug_xml += chunk;
            });
        };

        xml.on('startElement: nmwg:metadata', function(data) {
            if(result !== null) {
                results.push({endpoint: endpoint, data: result});
            }
            endpoint = {};
            result = [];
        });
        xml.on('endElement: nmwgt:endPointPair > nmwgt:src', function(data) {
            //endpoint.src_type = data['$']['type'];
            endpoint.src = data['$']['value'];
        });
        xml.on('endElement: nmwgt:endPointPair > nmwgt:dst', function(data) {
            //endpoint.dst_type = data['$']['type'];
            endpoint.dst = data['$']['value'];
        });
        xml.on('endElement: nmwg:parameter', function(data) {
            var key = data['$']['name'];
            var value = parseInt(data['$']['value']);
            endpoint[key] = value; 
        });
        xml.on('startElement: nmwg:data', function(data) {
            routes = {};
            time = null;
            maxttl = 0;
        });        
        xml.on('endElement: traceroute:datum', function(data) {
            var route = data['$'];
            var ttl = parseInt(route.ttl);
            if(ttl > maxttl) maxttl = ttl;
            if(routes[ttl] === undefined) {
                routes[ttl] = {hop: undefined, rtts:[]};
            }
            routes[ttl].hop = route.hop;
            var value_id = route.queryNum;
            var value = parseFloat(route.value);
            routes[ttl].rtts.push(value); //let's ignore queryNum for now...

            //all datum seem to contain the same time.. so let's promote this to higher in the tree
            time = parseInt(route.timeValue)*1000;
            valueunit = route.valueUnits;
        });        
        xml.on('endElement: nmwg:data', function(data) {
            //turn routes object into an array (sorted by ttl)
            var routes_a = [];
            for(var t = 1; t <= maxttl; t++) {
                if(routes[t] === undefined) {
                    routes_a.push({});//missing hop
                } else {
                    routes_a.push(routes[t]);
                }
            }
            result.push({time: time, rtt_unit: valueunit, hops: routes_a});
        });
        xml.on('end', function() {
            if(request_options.debug) {
                console.log(debug_xml);
            }
            if(result !== null) {
                results.push({endpoint: endpoint, routes: result});
            }
            callback(null, results);
        });
    });
};


//set options.endpoint with list of endpoints obtained from endpoints_pinger()
//so that it has _datakeys array.
exports.pinger = function(options, callback) {
    var options = merge({
        host: "web100.maxgigapop.net",
        port: 8075,
        path: "/perfSONAR_PS/services/pinger/ma",
        starttime: now.getTime() - 1800*5*1000,
        endtime: now.getTime(),
        resolution: 5,
        consolidation_function: "AVERAGE",
        debug: false
    }, options);
    var request_options = {
        host: options.host,
        port: options.port,
        path: options.path,
        debug: options.debug
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
        setaddrtype(options.endpoints);

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
        var body = scum.render("pinger_madata.ejs", options);
        scum.post(body, request_options, function(err, res){
            if(err) throw err;
            res.setEncoding('utf8');
            var xml = new xmlstream(res);
            var meta1, meta2, data;
            var commontimes;
            var commontime;
            var pinger_params;
            var results = {};

            /*
            var debug_body = "";
            res.on('data', function (chunk) {
                debug_body += chunk;
            });
            */

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
                    var key = meta2['nmwg:key']['$']['id'];
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


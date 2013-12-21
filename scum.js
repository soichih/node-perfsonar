var http = require('http');
var ejs = require('ejs');
var fs = require('fs');
var merge = require('merge');
var xml2js = require('xml2js');

exports.render = function(template, options) {
    var body = ejs.render(fs.readFileSync(__dirname+'/templates/'+template, 'utf8'), options);
    return body; 
}

exports.post_and_parse = function(body, options, callback) {
    var env = ejs.render(fs.readFileSync(__dirname+'/templates/envelope.ejs', 'utf8'), {body: body});
    var options = merge({
        method: 'POST'
    }, options);
    //console.dir(options);
    var req = http.request(options, function(res) {
        //res.statusCode
        //res.headers
        var resbody = "";
        res.on('data', function (chunk) {
            resbody += chunk;
        });
        res.on('end', function () {                           
            if(res.statusCode == 200) {
                //var parser = new expat.Parser("UTF-8");
                if(options.debug) {
                    console.log(resbody);
                }
                xml2js.parseString(resbody, function(err, result) {
                    if(err) throw err;
                    callback(null, result['SOAP-ENV:Envelope']['SOAP-ENV:Body']);            
                });
            } else {
                callback(new Error("request failed with status code:"+res.statusCode), null);
            }
        });                   
    });
    req.on('error', function(e) {
        //console.log("http.requet failed with following options");
        //console.dir(options);
        callback(e, null);
    });
    //console.log("sending\n"+env);
    req.write(env);
    req.end();
}

exports.post = function(body, options, callback) {
    var env = ejs.render(fs.readFileSync(__dirname+'/templates/envelope.ejs', 'utf8'), {body: body});
    var options = merge({
        method: 'POST'
    }, options);
    var req = http.request(options, callback);
    req.on('error', function(e) {
        console.log('problem with request:'+e.message);
    });
    req.write(env);
    req.end();
}

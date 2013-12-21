# node-perfsonar

XmlStream is a Node.js XML stream parser and editor, based on
[node-expat](https://github.com/astro/node-expat) (libexpat SAX-like parser
binding).

node-perfsonar is a perfsonar client that let you easily access data stored in various perfsonar servers. 

```
npm install perfsonar
```

## ps.endpoints

perfsonar server publishes which endpoints (source / destination pairs) that the server is currently monitoring.
If you know the hostname of the perfsonar instance, you can pull list of all endpoints.

```javascript
var ps = require('perfsonar');
ps.endpoints({server: 'atlas-owamp.bu.edu'}, function(err, endpoints) {
    if(err) throw err;
    console.dir(endpoints);
});
```

Example output.

```javascript
{ iperf: [],
  owamp:
   [ { src_type: 'ipv4',
       src: '192.12.15.26',
       dst_type: 'ipv4',
       dst: '192.5.207.251',
       count: 18000,
       bucket_width: 0.001,
       schedule: [Object] },
     { src_type: 'ipv4',
       src: '192.41.230.19',
       dst_type: 'ipv4',
       dst: '192.5.207.251',
       count: 18000,
       bucket_width: 0.001,
       schedule: [Object] },
    ...
     { src_type: 'ipv4',
       src: '128.135.158.216',
       dst_type: 'ipv4',
       dst: '192.5.207.251',
       count: 18000,
       bucket_width: 0.001,
       schedule: [Object] } ],
  pinger:
   [ { src_type: 'ipv4',
       src: '192.5.207.251',
       dst_type: 'ipv4',
       dst: '134.158.20.192',
       _datakeys: [Object],
       count: 10,
       packetSize: 1000,
       ttl: 255,
       transport: 'icmp',
       packetInterval: 1 },
     { src_type: 'ipv4',
       src: '192.5.207.251',
       dst_type: 'ipv4',
       dst: '193.62.56.9',
       _datakeys: [Object],
       count: 10,
       packetSize: 1000,
       ttl: 255,
       transport: 'icmp',
       packetInterval: 1 },
    ...
     { src_type: 'ipv4',
       src: '192.5.207.251',
       dst_type: 'ipv4',
       dst: '192.101.161.186',
       _datakeys: [Object],
       count: 10,
       packetSize: 1000,
       ttl: 255,
       transport: 'icmp',
       packetInterval: 1 } ] }
```

atlas-owamp.bu.edu is a latency monitoring instance. If you try atlas-bwctl.bu.edu instead, you will see iperf endpoints like...

```javascript
{ pinger: [],
  owamp: [],
  iperf:
   [ { src_type: 'hostname',
       src: 'perfsonar2.pi.infn.it',
       dst_type: 'hostname',
       dst: 'atlas-npt2.bu.edu',
       protocol: 'TCP',
       duration: 30 },
     { src_type: 'hostname',
       src: 'perfsonar-1.t2.ucsd.edu',
       dst_type: 'hostname',
       dst: 'atlas-npt2.bu.edu',
       protocol: 'TCP',
       duration: 30 }
    ...
     { src_type: 'hostname',
       src: 'lhcmon.bnl.gov',
       dst_type: 'hostname',
       dst: 'atlas-npt2.bu.edu',
       protocol: 'TCP',
       duration: 30 } ] }
```

## ps.owamp

You can pull all owamp measurment data collected within the last hour by..

```javascript
var ps = require('perfsonar');
var now = new Date().getTime();
ps.owamp({
    server: "perfsonar-2.t2.ucsd.edu",-
    starttime: now - 3600*1000, //-1 hour
    endtime: now
}, function(err, results) {
    if(err) throw err;
    console.dir(results[0]); //displaying only the first result.. to keep this README simple
})
```

Exmple output..

```javascript
{ endpoint:
   { src_type: 'ipv4',
     src: '132.239.252.68',
     dst_type: 'ipv4',
     dst: '169.228.130.40',
     count: 108000,
     bucket_width: 0.0001,
     schedule: [ [Object] ] },
  data:
   [ { start_time: 1387644690221,
       end_time: 1387644751188,
       min_ttl: 252,
       max_ttl: 252,
       min_delay: 0.000287533,
       max_delay: 0.000332832,
       max_error: 0.000217438,
       duplicates: 0,
       sent: 600,
       loss: 0 },
     { start_time: 1387644751189,
       end_time: 1387644810176,
       min_ttl: 252,
       max_ttl: 252,
       min_delay: 0.000295639,
       max_delay: 0.000352859,
       max_error: 0.000217438,
       duplicates: 0,
       sent: 600,
       loss: 0 }
   ] 
}
```

Or, you can specify which endpoints you want to pull test results for, by using endpoint returned from ps.endpoints() we called earlier.

```javascript
var ps = require('perfsonar');
ps.endpoints({server: "psonar1.fnal.gov"}, function(err, endpoints) {
    if(err) throw err;
    var now = new Date().getTime();
    ps.iperf({
        server: "psonar1.fnal.gov",
        endpoints: [endpoints.iperf[0]], //just pick one iperf endpoint randomely (you can only set 1 endpoint for now)
        starttime: now - 3600*1000*5, //5 hours
        endtime: now
    }, function(err, results) {
        if(err) throw err;
        console.dir(results[0]); //again, display data for the first endpoint (although there should be only 1)
    });
});
```

Currently, you can only specify 1 endpoint (I don't know how to query it on perfsonar/ma service), but I am hoping to be able to specify
multiple endpoints that you are interested in.

Sample output.

```javascript
{ endpoint:
   { src_type: 'hostname',
     src: 'psonar1.fnal.gov',
     dst_type: 'hostname',
     dst: 'perfsonar-ps.cnaf.infn.it',
     protocol: 'TCP',
     duration: 20 },
  data:
   [ { time: 1387632659326, throughput: 176263000 },
     { time: 1387636109411, throughput: 320624000 },
     { time: 1387639808107, throughput: 332058000 },
     { time: 1387640253208, throughput: 350271000 },
     { time: 1387643617324, throughput: 338400000 } ] }
```

## ps.iperf

Similar to ps.owamp, you can query iperf (bandwidth) test results.

```javascript
var ps = require('perfsonar');
var now = new Date().getTime();
ps.owamp({
    server: "perfsonar-2.t2.ucsd.edu",-
    starttime: now - 3600*1000*5 //5 hours
}, function(err, data) {
    if(err) throw err;
    console.dir(data[0]);
});
```

Sample output

```javascript
{ endpoint:
   { src_type: 'ipv4',
     src: '132.239.252.68',
     dst_type: 'ipv4',
     dst: '169.228.130.40',
     count: 108000,
     bucket_width: 0.0001,
     schedule: [ [Object] ] },
  data:
   [ { start_time: 1387646616309,
       end_time: 1387646679361,
       min_ttl: 252,
       max_ttl: 252,
       min_delay: 0.000457287,
       max_delay: 0.000565529,
       max_error: 0.000190258,
       duplicates: 0,
       sent: 600,
       loss: 0 },
     { start_time: 1387646620226,
       end_time: 1387646681809,
       min_ttl: 252,
       max_ttl: 252,
       min_delay: 0.00045681,
       max_delay: 0.00242376,
       max_error: 0.000190258,
       duplicates: 0,
       sent: 600,
       loss: 0 }
    ...
```

## ps.pinger

Querying pingER restuls gathered within the last hour.

```javascript
var ps = require('perfsonar');
var now = new Date().getTime();
ps.pinger({
    server: "perfsonar01.cmsaf.mit.edu",
    starttime: now - 3600*1000
}, function(err, results) {
    if(err) throw err;
    //display all results..
    results.forEach(function(result) {
        console.dir(result);
    });
});
```

Sample output

```javascript
{ src_type: 'ipv4',
  src: '18.12.1.171',
  dst_type: 'ipv4',
  dst: '131.225.206.112',
  _datakeys: [ '33' ],
  count: 10,
  packetSize: 1000,
  ttl: 255,
  transport: 'icmp',
  packetInterval: 1,
  data: [] }
{ src_type: 'ipv4',
  src: '18.12.1.171',
  dst_type: 'ipv4',
  dst: '193.109.172.188',
  _datakeys: [ '32', '52' ],
  count: 10,
  packetSize: 1000,
  ttl: 255,
  transport: 'icmp',
  packetInterval: 1,
  data:
   [ { minRtt: 122.811,
       maxRtt: 135.218,
       medianRtt: 128.5,
       meanRtt: 129.019,
       iqrIpd: 13,
       maxIpd: 13,
       meanIpd: 8.667,
       time: 1387650363000 },
     { minRtt: 122.782,
       maxRtt: 135.235,
       medianRtt: 135,
       meanRtt: 132.724,
       iqrIpd: 13,
       maxIpd: 13,
       meanIpd: 5.778,
       time: 1387651563000 },
     { minRtt: 122.827,
       maxRtt: 135.238,
       medianRtt: 135,
       meanRtt: 129.915,
       clp: 33.333,
       maxIpd: 13,
       meanIpd: 10.833,
       time: 1387653963000 },
     { minRtt: 122.869,
       maxRtt: 135.228,
       medianRtt: 122,
       meanRtt: 128.179,
       clp: 33.333,
       iqrIpd: 13,
       maxIpd: 13,
       meanIpd: 8.667,
       time: 1387655173000 },
...
     { minRtt: 122.802,
       maxRtt: 135.185,
       medianRtt: 122,
       meanRtt: 124.116,
       maxIpd: 13,
       meanIpd: 1.444,
       time: 1387656373000 } ] }
```

Pinger query on all available endpoints are very slow.. (complain to perfsonar team!) You can specify endpoints that you are interested in.

```javascript
var ps = require('perfsonar');
ps.endpoints({server: "perfsonar01.cmsaf.mit.edu"}, function(err, endpoints) {
    ps.pinger({
        server: "perfsonar01.cmsaf.mit.edu",
        endpoints: [ endpoints.pinger[0], endpoints.pinger[1] ]
    }, function(err, results) {
        if(err) throw err;
        results.forEach(function(result) {
            console.dir(result);
        });
    });
});

```


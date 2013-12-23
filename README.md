# node-perfsonar

node-perfsonar is a perfsonar client to access data stored in various perfsonar instances around the world.

```
npm install perfsonar
```

## ps.endpoints

perfsonar server publishes lists of endpoints that it monitors.
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

Why is iperf list empty? Because atlas-owamp.bu.edu is a latency monitoring instance. If you try atlas-bwctl.bu.edu instead, you will see iperf (but not owamp / pinger)

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

You can pull all owamp test results collected within the last hour by...

```javascript
var ps = require('perfsonar');
var now = new Date().getTime();
ps.owamp({
    server: "perfsonar-2.t2.ucsd.edu",
    starttime: now - 3600*1000, //-1 hour
    endtime: now
}, function(err, results) {
    if(err) throw err;
    console.dir(results[0]); //displaying only the first result.. to keep this README simple
})
```

Sample output..

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

Or, you can specify which endpoints you want to pull test results for, by using endpoints returned from ps.endpoints().

```javascript
var ps = require('perfsonar');
ps.endpoints({server: "psonar1.fnal.gov"}, function(err, endpoints) {
    if(err) throw err;
    var now = new Date().getTime();
    ps.iperf({
        server: "psonar1.fnal.gov",
        endpoints: [endpoints.iperf[0]], //just pick one iperf endpoint randomly
        starttime: now - 3600*1000*5, //5 hours
        endtime: now
    }, function(err, results) {
        if(err) throw err;
        console.dir(results[0]); //again, display data for the first endpoint (although there should be only 1)
    });
});
```

Currently, you can only specify 1 endpoint (I don't know how to query it on perfsonar/ma service. If you know how, please let me now!)

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

Similar to ps.owamp, you can query iperf (bandwidth) test results. You can also set endpoints option to specify endpoint that you 
are interested in (you can only specify 1 endpoint -- for now)

```javascript
var ps = require('perfsonar');
var now = new Date().getTime();
ps.iperf({
    server: "perfsonar-2.t2.ucsd.edu",
    starttime: now - 3600*1000*5 //5 hours
}, function(err, data) {
    if(err) throw err;
    console.dir(data[0]);
});
```

Sample output..

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

Warning: pingER query is slow! Due to some seriously convoluted interface design..

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

You can specify endpoints that you are interested in.  Unlike owamp / iperf, though, you can specify more than 1 endpoints, 
but you have to use endpoints returned from endpoints() which contains _datakeys parameter.

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

## ps.traceroute

Querying traceroute restuls gathered within the last hour.

```javascript
var ps = require('perfsonar');
var now = new Date().getTime();
ps.endpoints({server: "atlas-owamp.bu.edu"}, function(err, endpoints) {
    ps.traceroute({
        server: "atlas-owamp.bu.edu",
        starttime: now - 3600*1000,
        endtime: now,
        endpoints: [ endpoints.traceroute[0] ]
    }, function(err, results) {
        console.dir(results[0].endpoint);
        console.log(JSON.stringify(results[0].data[0], undefined, 2));
    });
});
```

Sample output. 

```javascript
{ src_type: 'hostname',
  src: 'atlas-npt1.bu.edu',
  dst_type: 'hostname',
  dst: 'ccperfsonar2-lhcopn.in2p3.fr' }
{
  "time": 1387756831000,
  "unit": "ms",
  "routes": [
    {
      "hop": "192.5.207.1",
      "values": [
        0.301,
        0.433,
        0.59
      ]
    },
    {
      "hop": "192.5.89.141",
      "values": [
        0.478,
        0.556,
        0.613
      ]
    },
    {
      "hop": "192.5.89.29",
      "values": [
        9.901,
        10.082,
        10.125
      ]
    },
    {
      "hop": "192.5.89.222",
      "values": [
        14.178,
        14.19,
        14.177
      ]
    },
    {
      "hop": "198.71.45.237",
      "values": [
        100.873,
        90.322,
        100.859
      ]
    },
    {
      "hop": "62.40.98.115",
      "values": [
        88.385,
        88.455,
        100.776
      ]
    },
    {
      "hop": "62.40.98.80",
      "values": [
        120.716,
        108.243,
        108.347
      ]
    },
    {
      "hop": "62.40.98.77",
      "values": [
        114.185,
        114.386,
        114.348
      ]
    },
    {
      "hop": "62.40.124.70",
      "values": [
        129.268,
        118.524,
        116.721
      ]
    },
    {
      "hop": "error:requestTimedOut",
      "values": [
        0,
        0,
        0
      ]
    },
    {
      "hop": "193.51.186.177",
      "values": [
        119.436,
        119.841,
        119.807
      ]
    },
    {
      "hop": "192.70.69.130",
      "values": [
        107.796,
        110.56,
        110.389
      ]
    },
    {
      "hop": "193.48.99.78",
      "values": [
        107.14,
        119.619,
        119.501
      ]
    }
  ]
}

```

Values usually contains 3 values.. for each tests. You have to have 1 and only 1 endpoint specified (at the moment)

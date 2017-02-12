# node-perfsonar

node-perfsonar is a simple perfsonar client.

```
npm install perfsonar
```

## Lookup Service

perfSONAR provides global lookup service, which is a database of all perfSONAR toolkit sites that are
registered to the global lookup service. 

To query it, you first need to know the hostnames for those global lookup services

### ls.global.gethosts()

Return list of all active global lookup service instances.

```javascript
ls.global.gethosts((err, hosts)=>{
    if(err) throw err;
    console.dir(hosts);
});
```

```javascript
[ 'http://ps-west.es.net:8090/lookup/records',
  'http://ps-east.es.net:8090/lookup/records',
  'http://monipe-ls.rnp.br:8090/lookup/records',
  'http://ps-sls.sanren.ac.za:8090/lookup/records',
  'http://nsw-brwy-sls1.aarnet.net.au:8090/lookup/records/' ]
```

Each lookup service instances contains different sets of hosts, so you basically need to query them all..

### ls.query

Query lookup service. 

To query for toolkit hosts do something like .. 

```javascript
ls.query('http://ps-west.es.net:8090/lookup/records', {
    type: "host"
}, function(err, records) {
    if(err) throw err;
    console.dir(records);
});
```

```javascript
{ 'host-vm': [ '0' ],
  'host-administrators': [ '' ],
  expires: '2017-02-12T02:25:54.153Z',
  'host-hardware-processorcore': [ '4' ],
  'host-os-kernel': [ 'Linux 2.6.32-504.16.2.el6.web100.x86_64' ],
  'host-os-name': [ 'CentOS' ],
  type: [ 'host' ],
  'host-hardware-processorspeed': [ '2599.800 MHz' ],
  'host-os-version': [ '6.8 (Final)' ],
  'host-net-interfaces': [ 'lookup/interface/2b6a8267-f0d2-424f-9c5b-b3fcb37f58a1' ],
  'host-productname': [ 'RS161-E2/PA2' ],
  'client-uuid': [ '1df374e0-6b3c-42e0-aca1-f77c747c8e5f' ],
  'pshost-bundle': [ 'perfsonar-toolkit' ],
  state: 'renewed',
  'host-net-tcp-maxbuffer-recv': [ '67108864 bytes' ],
  'host-net-tcp-autotunemaxbuffer-send': [ '33554432 bytes' ],
  'pshost-toolkitversion': [ '3.5.1.7' ],
  'host-manufacturer': [ 'ASUS' ],
  'host-hardware-cpuid': [ 'Dual Core AMD Opteron(tm) Processor 285' ],
  'host-hardware-processorcount': [ '2' ],
  'pshost-bundle-version': [ '3.5.1.7' ],
  'host-net-tcp-congestionalgorithm': [ 'htcp' ],
  'host-name': [ '137.78.167.76', 'ps-171-230-node1.jpl.nasa.gov' ],
  uri: 'lookup/host/b6ce7f69-3bc7-476d-8276-394f0f8ca9e6',
  'host-net-tcp-autotunemaxbuffer-recv': [ '33554432 bytes' ],
  'group-domains': [ 'jpl.nasa.gov', 'nasa.gov' ],
  'host-hardware-memory': [ '3390 MB' ],
  'host-net-tcp-maxbuffer-send': [ '67108864 bytes' ],
  ttl: [] }

```

> For URL, use entries obtained from ls.global.gethosts

host records isn't enough to know what services this host is running.. For that you need to query services by matching host's client-uuid field to service record's

```javascript
ls.query('http://ps-west.es.net:8090/lookup/records', {
    type: "service",
    "client-uuid": "1df374e0-6b3c-42e0-aca1-f77c747c8e5f",
}, function(err, records) {
    if(err) throw err;
    records.forEach((record)=>{
        console.log(record['service-name']);
    });
});
```

```javascript
[ 'MP Measurement Point' ]
[ 'OWAMP Server' ]
[ 'Measurement Archive' ]
[ 'Traceroute Responder' ]
[ 'Ping Responder' ]
[ 'BWCTL Measurement Point' ]
[ 'BWCTL Server' ]
```

> You can use "host-url" to look for services, but keep it mind that host-url changes constantly even for the same host. Use client-uuid if you are going to cache it.


## Measurment Archive Methods

### ps.ma.endpoint

perfsonar server publishes lists of endpoints that it monitors.
If you know the hostname of the perfsonar instance, you can pull list of all endpoints.

```javascript
var ps = require('perfsonar');

ps.ma.endpoint({server: "ps-development.bnl.gov", debug: true}, function(err, endpoints) {
    if(err) throw err;
    console.log(JSON.stringify(endpoints, null, 2));
});
```

Example output.

```javascript
{ iperf: [],
  owamp:
   [ { src: '192.12.15.26',
       dst: '192.5.207.251',
       count: 18000,
       bucket_width: 0.001,
       schedule: [Object] },
     { src: '192.41.230.19',
       dst: '192.5.207.251',
       count: 18000,
       bucket_width: 0.001,
       schedule: [Object] },
    ...
     { src: '128.135.158.216',
       dst: '192.5.207.251',
       count: 18000,
       bucket_width: 0.001,
       schedule: [Object] } ],
  pinger:
   [ { src: '192.5.207.251',
       dst: '134.158.20.192',
       _datakeys: [Object],
       count: 10,
       packetSize: 1000,
       ttl: 255,
       transport: 'icmp',
       packetInterval: 1 },
     { src: '192.5.207.251',
       dst: '193.62.56.9',
       _datakeys: [Object],
       count: 10,
       packetSize: 1000,
       ttl: 255,
       transport: 'icmp',
       packetInterval: 1 },
    ...
     { src: '192.5.207.251',
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
   [ { src: 'perfsonar2.pi.infn.it',
       dst: 'atlas-npt2.bu.edu',
       protocol: 'TCP',
       duration: 30 },
     { 
       src: 'perfsonar-1.t2.ucsd.edu',
       dst: 'atlas-npt2.bu.edu',
       protocol: 'TCP',
       duration: 30 }
    ...
     { src: 'lhcmon.bnl.gov',
       dst: 'atlas-npt2.bu.edu',
       protocol: 'TCP',
       duration: 30 } ] }
```

### ps.ma.owamp

You can pull all owamp test results collected within the last hour by...

```javascript
var ps = require('perfsonar');
ps.ma.endpoint({host: "perfsonar-2.t2.ucsd.edu"}, function(err, endpoints) {
    if(err) throw err;
    ps.ma.owamp({
        host: "perfsonar-2.t2.ucsd.edu", 
        endpoints: [endpoints.owamp[0]]//just pick one from the list
    }, function(err, data) {
        if(err) throw err;
        console.dir(data[0].endpoint); 
        console.dir(data[0].data); 
    });
});
```

Sample output..

```javascript
{ endpoint:
   { src: '132.239.252.68',
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
ps.endpoint({host: "perfsonar-2.t2.ucsd.edu"}, function(err, endpoints) {
    if(err) throw err;
    ps.ma.owamp({
        host: "perfsonar-2.t2.ucsd.edu",
        endpoints: [endpoints.owamp[0]] //just pick one randomly from iperf endpoints
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
   { src: '132.239.252.68',
     dst: '169.228.130.40',
     count: 108000,
     bucket_width: 0.0001,
     schedule: [ [Object] ] },
  data:
   [ { start_time: 1387747211387,
       end_time: 1387747270209,
       min_ttl: 252,
       max_ttl: 252,
       min_delay: 0.000152111,
       max_delay: 0.000980377,
       max_error: 0.000177383,
       duplicates: 0,
       sent: 600,
       loss: 0 },
     { start_time: 1387747244111,
       end_time: 1387747302265,
       min_ttl: 252,
       max_ttl: 252,
       min_delay: 0.000152111,
       max_delay: 0.00146103,
       max_error: 0.000177383,
       duplicates: 0,
       sent: 600,
       loss: 0 },
...
```

### ps.ma.iperf

Similar to ps.owamp, you can query iperf (bandwidth) test results. You can also set endpoints option to specify endpoint that you 
are interested in (you can only specify 1 endpoint -- for now)

```javascript
var ps = require('perfsonar');
var now = new Date().getTime();
var host = "chic-pt1.es.net";
ps.ma.endpoint({host: host}, function(err, endpoints) {
    console.dir(endpoints);
    if(err) throw err;
    ps.ma.iperf({
        host: host,
        starttime: now - 3600*1000*24*90,
        endpoints: [ endpoints.iperf[0] ]
    }, function(err, data) {
        if(err) throw err;
        console.log(JSON.stringify(data, null, 2));
    });
});
```

Sample output..

```javascript
[
  {
    "endpoint": {
      "src": "hcc-ps02.unl.edu",
      "dst": "128.211.143.4",
      "protocol": "TCP",
      "duration": 30
    },
    "data": [
      {
        "time": 1380742483152,
        "throughput": 928939000
      },
      {
        "time": 1380788934185,
        "throughput": 928712000
      },
      {
        "time": 1380850884317,
        "throughput": 920837000
      },
      {
        "time": 1380907907430,
        "throughput": 927410000
      },
      {
        "time": 1380932116340,
        "throughput": 893389000
      },
      {
        "time": 1380967851138,
        "throughput": 928438000
      },
      {
        "time": 1380987632403,
        "throughput": 928993000
      },
      {
        "time": 1381027201152,
        "throughput": 928007000
      },
      {
        "time": 1381043975321,
        "throughput": 929642000
      },
      {
        "time": 1381073308622,
        "throughput": 925931000
      },
      {
        "time": 1381104010343,
        "throughput": 928380000
      },
...
      {
        "time": 1382270196285,
        "throughput": 929267000
      },
      {
        "time": 1382309807414,
        "throughput": 914432000
      },
      {
        "time": 1382329802398,
        "throughput": 929891000
      },
      {
        "time": 1382339372381,
        "throughput": 324325000
      }
    ]
  }
]
```

### ps.ma.pinger

Querying pingER results gathered within the last hour.

Warning: pingER query is slow! Due to some seriously convoluted interface design..

```javascript
var ps = require('perfsonar');
var now = new Date().getTime();
var host = "perfsonar01.cmsaf.mit.edu";
ps.ma.endpoint({host: host}, function(err, endpoints) {
    ps.ma.pinger({
        host: host,
        endpoints: [ endpoints.pinger[0], endpoints.pinger[1] ]
    }, function(err, results) {
        if(err) throw err;
        results.forEach(function(result) {
            console.dir(result);
        });
    });
});
```

Sample output

```javascript
{ src: '18.12.1.171',
  dst: '131.225.206.112',
  _datakeys: [ '33' ],
  count: 10,
  packetSize: 1000,
  ttl: 255,
  transport: 'icmp',
  packetInterval: 1,
  data: [] }
{ src: '18.12.1.171',
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
var host = "perfsonar01.cmsaf.mit.edu";
ps.ma.endpoint({host: host}, function(err, endpoints) {
    ps.ma.pinger({
        host: host,
        endpoints: [ endpoints.pinger[0], endpoints.pinger[1] ]
    }, function(err, results) {
        if(err) throw err;
        results.forEach(function(result) {
            console.dir(result);
        });
    });
});

```

### ps.ma.traceroute

Querying traceroute results gathered within the last hour.

```javascript
var ps = require('perfsonar');
var now = new Date().getTime();
var host = "perfsonar-2.t2.ucsd.edu";
ps.ma.endpoint({host: host}, function(err, endpoints) {
    ps.ma.traceroute({host: host, endpoints: [ endpoints.traceroute[0]]}, function(err, results) {
        console.log(JSON.stringify(results, undefined, 2));
    });
});
```

Sample output. 

```javascript
{ src: 'atlas-npt1.bu.edu',
  dst: 'ccperfsonar2-lhcopn.in2p3.fr' }
{
  "time": 1387756831000,
  "unit": "ms",
  "routes": [
    {
      "hop": "192.5.207.1",
      "rtts": [
        0.301,
        0.433,
        0.59
      ]
    },
    {
      "hop": "192.5.89.141",
      "rtts": [
        0.478,
        0.556,
        0.613
      ]
    },
    {
      "hop": "192.5.89.29",
      "rtts": [
        9.901,
        10.082,
        10.125
      ]
    },
    {
      "hop": "error:requestTimedOut",
      "rtts": [
        0,
        0,
        0
      ]
    },
    {
      "hop": "193.51.186.177",
      "rtts": [
        119.436,
        119.841,
        119.807
      ]
    },
    {
      "hop": "192.70.69.130",
      "rtts": [
        107.796,
        110.56,
        110.389
      ]
    },
    {
      "hop": "193.48.99.78",
      "rtts": [
        107.14,
        119.619,
        119.501
      ]
    }
  ]
}

```

Values usually contains 3 values.. for each tests. You have to have 1 and only 1 endpoint specified (for now)

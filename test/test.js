const assert = require('assert');

const ls = require('../index').ls;
describe('ls', ()=>{

    var sample_host;

    describe('global', ()=>{
        it('query active hosts', (done)=>{
            ls.global.gethosts((err, hosts)=>{
                assert(hosts.length > 0);
                //assert(hosts[0].priority == parseInt(hosts[0].priority));
                console.dir(hosts);
                sample_host = hosts[0];
                done();
            });
        });
        /*
        it('query global lookup service endpoints', function() {
            ls.hello();
            assert.equal(-1, [1,2,3].indexOf(4));
        });
        */
    });

    describe('query', ()=> {
        var uuid;
        it('host records', (done)=> {
            ls.query(sample_host, {type: "host"}, function(err, records) {
                assert(records.length > 0);
                assert(records[0].type[0] == "host");
                console.dir(records[0]);
                uuid = records[0]['client-uuid'][0];
                done();
            });
        }); 
        it('service records', (done)=> {
            ls.query(sample_host, {type: "service", 'client-uuid': uuid }, function(err, records) {
                assert(records.length > 0);
                assert(records[0].type[0] == "service");
                //console.dir(records[0]);
                records.forEach((record)=>{
                    console.log(record['service-type']);
                });
                done();
            });
        }); 
    });
});

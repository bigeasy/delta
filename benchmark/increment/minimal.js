var delta = require('../../delta')
var delta_ = require('../../_delta')
var Benchmark = require('benchmark')

var events = require('events')
var ee = new events.EventEmitter

var suite = new Benchmark.Suite('call')

function fn () { delta(function () {}).ee(ee).on('end').cancel() }

function fn_ () { delta_(function () {}).ee(ee).on('end').cancel() }

for (var i = 1; i <= 4; i++)  {
    suite.add({
        name: '_delta minimal ' + i,
        fn: fn_
    })

    suite.add({
        name: ' delta minimal ' + i,
        fn: fn
    })
}

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})

suite.run()

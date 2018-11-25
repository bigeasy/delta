var delta = require('../../delta')
var delta_ = require('../../_delta')
var Benchmark = require('benchmark')

var events = require('events')
var ee = new events.EventEmitter

var suite = new Benchmark.Suite('call')

var assert = require('assert')

function builder (delta) {
    return function () {
        delta(function (error, data) {
            assert(data.length == 6)
        }).ee(ee).on('data', []).on('end')
        ee.emit('data', 1, 2)
        ee.emit('data', 3, 4)
        ee.emit('data', 5, 6)
        ee.emit('end')
    }
}

builder(delta)()

for (var i = 1; i <= 4; i++)  {
    suite.add({
        name: '_delta minimal ' + i,
        fn: builder(delta_)
    })

    suite.add({
        name: ' delta minimal ' + i,
        fn: builder(delta)
    })
}

suite.on('cycle', function(event) {
    console.log(String(event.target));
})

suite.on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})

suite.run()

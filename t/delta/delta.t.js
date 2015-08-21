require('proof')(1, prove)

function prove (assert) {
    var events = require('events')
    var Delta = require('../..')

    var delta = new Delta(function (error) {
        assert(error.message, 'errored', 'errored')
    })

    var ee = new events.EventEmitter
    delta.ee(ee)

    ee.emit('error', new Error('errored'))
}

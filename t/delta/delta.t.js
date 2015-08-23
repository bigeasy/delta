require('proof')(3, prove)

function prove (assert) {
    var EventEmitter = require('events').EventEmitter
    var Delta = require('../..')

    var delta = new Delta(function (error) {
        assert(error.message, 'errored', 'errored')
    })

    var ee = new EventEmitter
    delta.ee(ee).on('end')

    ee.emit('error', new Error('errored'))

    assert(EventEmitter.listenerCount(ee, 'error'), 0, 'error listeners cleared on error')
    assert(EventEmitter.listenerCount(ee, 'end'), 0, 'other listeners cleared on error')
}

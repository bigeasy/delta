require('proof')(5, prove)

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

    var delta = new Delta(function (error) {
        assert(error.message, 'wrapped', 'caught event handler error')
    })

    delta.ee(ee).on('wrap', function (value) {
        throw new Error('wrapped')
    })

    ee.emit('wrap', 1)

    var delta = new Delta(function (error, one, two, three) {
        if (error) throw error
        assert([ one, two, three ], [ [ 1, 2, 3 ], 2, 3 ], 'gathered')
    })

    delta.ee(new EventEmitter).ee(ee).on('data', []).on('end').on('signal')

    ee.emit('data', 1)
    ee.emit('data', 2)
    ee.emit('data', 3)

    ee.emit('signal', 2, 3)
    ee.emit('end')
}

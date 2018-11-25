require('proof')(15, prove)

function prove (okay) {
    var EventEmitter = require('events').EventEmitter
    var Delta = require('..')

    var delta = new Delta(function (error) {
        okay(error.message, 'errored', 'errored')
    })

    var ee = new EventEmitter
    delta.ee(ee).on('end')

    ee.emit('error', new Error('errored'))

    okay(EventEmitter.listenerCount(ee, 'error'), 0, 'error listeners cleared on error')
    okay(EventEmitter.listenerCount(ee, 'end'), 0, 'other listeners cleared on error')

    var delta = Delta(function (error) {
        okay(error.message, 'wrapped', 'caught event handler error')
    })

    delta.ee(ee).on('wrap', function (value) {
        throw new Error('wrapped')
    })

    ee.emit('wrap', 1)

    var count = 0
    var delta = new Delta(function (error) { if (error) throw error })

    delta.ee(ee).on('wrap', function (value) {
        if (++count == 2) {
            okay('handler called')
        }
    }).on('end')

    ee.emit('wrap', 1)
    ee.emit('wrap', 1)

    ee.emit('end')

    okay(EventEmitter.listenerCount(ee, 'error'), 0, 'error listeners cleared on end')

    var delta = new Delta(function (error, one, two, three) {
        if (error) throw error
        okay([ one, two, three ], [ [ 1, 2, 3 ], 2, 3 ], 'gathered')
    })

    delta.ee(new EventEmitter).ee(ee).on('data', []).on('end').on('signal')

    ee.emit('data', 1)
    ee.emit('data', 2)
    ee.emit('data', 3)

    ee.emit('signal', 2, 3)
    ee.emit('end')

    var delta = new Delta(function (error, one, two) {
        if (error) throw error
        okay(arguments.length, 0, 'all off')
    })
    delta.ee(ee).on('data', panic).on('end')
    delta.off(ee)
    ee.emit('data', 1)
    ee.emit('end', 1, 2)

    var delta = new Delta(function (error, one, two) {
        if (error) throw error
        okay([ one, two ], [ 1, 2 ], 'off at name level')
    })
    delta.ee(ee).on('data', panic)
                .on('other', function () { okay('other called') })
                .on('end')
    delta.off(ee, 'data')
    ee.emit('data')
    ee.emit('other')
    ee.emit('end', 1, 2)

    ee.emit('data')

    var delta = new Delta(function (error, one, two) {
        if (error) throw error
        okay([ one, two ], [ 1, 2 ], 'off at method level')
    })
    delta.ee(ee).on('data', panic)
                .on('data', function () { okay('other data called') })
                .on('end')
    delta.off(ee, 'data', panic)
    ee.emit('data')
    ee.emit('end', 1, 2)

    function panic () {
        throw new Error
    }

    var delta = new Delta(function (error, value) {
        okay(value, 1, 'value')
    }).ee(ee).on('end')
    delta.cancel([ null, 1 ])

    okay(EventEmitter.listenerCount(ee, 'error'), 0, 'error listeners cleared on cancel')
    okay(EventEmitter.listenerCount(ee, 'end'), 0, 'regular listeners cleared on cancel')

    delta.cancel([ null, 1 ])
}

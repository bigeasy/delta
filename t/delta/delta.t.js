require('proof')(1, prove)

function prove (assert) {
    var Delta = require('../..')

    assert(Delta, 'require')
}

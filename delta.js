var push = [].push

function Delta (callback) {
    this._callback = callback
    this._results = []
    this._waiting = 0
    this._listeners = []
    this._completed = false
}

Delta.prototype.ee = function (ee) {
    return new Constructor(this, ee)
}

Delta.prototype._unlisten = function () {
    this._listeners.forEach(function (listener) {
        unlisten(listener, this)
    }, this)
    this._listeners.length = 0
}

Delta.prototype.off = function (ee, name, f) {
    var listeners = this._listeners, i = 0, I = listeners.length, listener
    while (i < I) {
        listener = listeners[i]
        if (
            ee === listener.ee &&
            (!name || name == listener.name) &&
            (!f || f === listener.f)
        ) {
            if (listener.action === 'get' && !--this._waiting) {
                this._done()
                break
            }
            unlisten(listener, this)
            listeners.splice(i, 1)
            I--
        } else {
            i++
        }
    }
}

Delta.prototype.cancel = function (vargs) {
    if (!this._completed) {
        this._completed = true
        this._unlisten()
        this._callback.apply(null, vargs)
    }
}

function unlisten (listener, delta) {
    listener.f = null
    listener.ee.removeListener(listener.name, listener.listener)
}

Delta.prototype._rescue = function (error, ee) {
    error.ee = ee
    this._unlisten()
    this._callback.call(null, error)
}

Delta.prototype._done = function () {
    var vargs = []
    for (var i = 0, I = this._results.length; i < I; i++) {
        push.apply(vargs, this._results[i])
    }
    if (vargs.length) {
        vargs.unshift(null)
    }
    this._unlisten()
    this._callback.apply(null, vargs)
    this._completed = true
}

function Constructor (delta, ee) {
    var rescuer = {
        delta: delta,
        ee: ee,
        name: 'error',
        listener: function (error) {
            rescuer.delta._rescue(error, rescuer.ee)
        }
    }

    delta._listeners.push(rescuer)

    ee.on('error', rescuer.listener)

    this._delta = delta
    this._ee = ee
}

Constructor.prototype.on = function (name, object) {
    var delta = this._delta, ee = this._ee
    var action = null, listener = null, index = null, f = null

    if (Array.isArray(object)) {
        action = 'gather'
        delta._results.push([[]])
        index = delta._results.length - 1
        listener = function () {
            push.apply(delta._results[index][0], arguments)
        }
    } else if (typeof object == 'function') {
        action = 'invoke'
        f = object
        listener = function () {
            try {
                object.apply(null, arguments)
            } catch (error) {
                delta._rescue(error)
            }
        }
    } else {
        action = 'get'
        index = delta._results.length
        delta._results.push([])
        delta._waiting++
        listener = function () {
            push.apply(delta._results[index], arguments)
            delta.off(ee, name)
        }
    }

    this._delta._listeners.push({
        delta: delta,
        ee: ee,
        name: name,
        action: action,
        listener: listener,
        index: index,
        f: f
    })
    this._ee.on(name, listener)

    return this
}

Constructor.prototype.ee = function (ee) {
    return new Constructor(this._delta, ee)
}

Constructor.prototype.cancel = function (vargs) {
    this._delta.cancel(vargs)
}

module.exports = function (callback) { return new Delta(callback) }

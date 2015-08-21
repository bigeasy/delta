var rescuers = [], listeners = []

function Delta (callback) {
    this._callback = callback
    this._waiting = 0
    this._completed = 0
    this._listeners = []
    this._results = []
}

Delta.prototype.ee = function (ee) {
    var rescuer = rescuers.pop()
    if (rescuer == null) {
        rescuer = {
            delta: this,
            listener: function (error) {
                rescuer.delta._rescue(error)
                rescuers.push(rescuer)
            }
        }
    } else {
        rescuer.delta = this
    }
    ee.on('error', rescuer.listener)
    this._listeners.push({
        ee: ee,
        name: 'error',
        listener: rescuer.listener,
        heap: rescuers
    })
    return new Constructor(this, ee)
}

Delta.prototype._unlisten = function () {
    for (var i = 0, I = this._listeners.length; i < I; i++) {
        var listener = this._listeners[i]
        listener.ee.removeListener(listener.name, listener.listener)
        listener.heap.push(listener)
    }
}

Delta.prototype._rescue = function (error) {
    this._unlisten()
    this._callback.call(null, error)
}

Delta.prototype._complete = function () {
    if (this._waiting == ++this._complete) {
        this._unlisten()
        var vargs = []
        for (var i = 0, I = this._results.length; i < I; i++) {
            push.apply(vargs, this._results[i])
        }
        this._callback.apply(null, vargs)
    }
}

function Constructor (delta, ee) {
    this._delta = delta
    this._ee = ee
}

function gather (vargs) {
    push.apply(this._delta._results[this.index][0], vargs)
}

function get (vargs) {
    push.apply(this._delta._results[this.index], vargs)
    this._delta._complete()
}

Constructor.prototype.on = function (name, reaction) {
    var callback = listeners.pop()

    if (callback == null) {
        callback = {
            delta: null,
            index: 0,
            action: null,
            listener: function () {
                var vargs = new Array
                for (var i = 0, I = arguments.length; i < I; i++) {
                    vargs[i] = arguments[i]
                }
                callback.listener(vargs)
            }
        }
    }

    callback.delta = this._delta

    if (Array.isArray(reaction)) {
        this._delta.results.push([[]])
        callback.action = gather
    } else if (typeof reaction == 'function') {
        callback.action = function (vargs) {
            try {
                reaction(vargs)
            } catch (error) {
                this._delta._rescue(error)
            }
        }
    } else {
        this._delta.results.push([])
        this._delta.waiting++
        callback.index = this._delta.results.length - 1
        callback.action = get
    }

    this._delta._listeners.push({
        ee: this._ee,
        name: name,
        listener: callback.listener,
        heap: listeners
    })
    this._ee.on(name, callback.callback)
}

module.exports = Delta

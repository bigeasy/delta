var rescuers = [], listeners = [], push = [].push

function Delta (callback) {
    this._callback = callback
    this._results = []
    this._waiting = 0
    this._completed = 0
    this._listeners = []
}

Delta.prototype.ee = function (ee) {
    return new Constructor(this, ee)
}

Delta.prototype._unlisten = function () {
    for (var i = 0, I = this._listeners.length; i < I; i++) {
        var listener = this._listeners[i]
        listener.ee.removeListener(listener.name, listener.callback.listener)
        listener.heap.push(listener.callback)
    }
}

Delta.prototype._rescue = function (error) {
    this._unlisten()
    this._callback.call(null, error)
}

Delta.prototype._complete = function () {
    if (this._waiting == ++this._completed) {
        this._unlisten()
        var vargs = [ null ]
        for (var i = 0, I = this._results.length; i < I; i++) {
            push.apply(vargs, this._results[i])
        }
        this._callback.apply(null, vargs)
    }
}

function Constructor (delta, ee) {
    var rescuer = rescuers.pop()
    if (rescuer == null) {
        rescuer = {
            delta: delta,
            listener: function (error) {
                rescuer.delta._rescue(error)
                rescuers.push(rescuer)
            }
        }
    } else {
        rescuer.delta = delta
    }

    delta._listeners.push({
        ee: ee,
        name: 'error',
        callback: rescuer,
        heap: rescuers
    })

    ee.on('error', rescuer.listener)

    this._delta = delta
    this._ee = ee
}

function gather (vargs) {
    push.apply(this.delta._results[this.index][0], vargs)
}

function get (vargs) {
    push.apply(this.delta._results[this.index], vargs)
    this.delta._complete()
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
                callback.action(vargs)
            }
        }
    }

    callback.delta = this._delta

    if (Array.isArray(reaction)) {
        this._delta._results.push([[]])
        callback.action = gather
    } else if (typeof reaction == 'function') {
        callback.action = function (vargs) {
            try {
                reaction.apply(null, vargs)
            } catch (error) {
                this.delta._rescue(error)
            }
        }
    } else {
        this._delta._results.push([])
        this._delta._waiting++
        callback.index = this._delta._results.length - 1
        callback.action = get
    }

    this._delta._listeners.push({
        ee: this._ee,
        name: name,
        callback: callback,
        heap: listeners
    })

    this._ee.on(name, callback.listener)

    return this
}

Constructor.prototype.ee = function (ee) {
    return new Constructor(this._delta, ee)
}

module.exports = Delta

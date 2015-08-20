var rescuers = [], callbacks = []

function Sink (callback, terminator) {
    this._callback = callback
    this._terminator = terminator || noop
    this._waiting = 0
    this._completed = 0
    this._listeners = []
    this._results = []
}

Sink.prototype.ee = function (ee) {
    var rescuer = rescuers.pop()
    if (rescuer == null) {
        rescuer = {
            sink: this,
            callback: function (error) {
                rescuer.sink.rescue(error)
                rescuers.push(rescuer)
            }
        }
    } else {
        rescuer.sink = this
    }
    ee.on('error', rescuer)
    this._eventEmitters.push(ee)
    return new Constructor(this, ee)
}

Sink.prototype._unlisten = function () {
    for (var i = 0, I = this._listeners.length; i < I; i++) {
        var listener = this._listeners[i]
        listener.ee.removeListener(listener.name, listener.listener)
    }
}

Sink.prototype._complete = function () {
    if (this._waiting == ++this._complete) {
        this._unlisten()
        var vargs = []
        for (var i = 0, I = this._results.length; i < I; i++) {
            push.apply(vargs, this._results[i])
        }
    }
}

function Constructor (sink, ee) {
    this._sink = sink
    this._ee = ee
}

function gather (vargs) {
    push.apply(this.sink.results[this.index][0], vargs)
}

function get (vargs) {
    push.apply(this.sink.results[this.index], vargs)
    this.sink._complete()
}

Constructor.prototype.on = function (name, reaction) {
    var callback = callbacks.pop()

    if (callback == null) {
        callback = {
            sink: null,
            index: 0,
            action: null,
            listener: function () {
                var vargs = new Array
                for (var i = 0, I = arguments.length; i < I; i++) {
                    vargs[i] = arguments[i]
                }
                callback.listener(vargs)
                callbacks.push(callback)
            }
        }
    }

    callback.sink = this._sink

    if (Array.isArray(reaction)) {
        this._sink.results.push([[]])
        callback.action = gather
    } else if (typeof reaction == 'function') {
        callback.action = function (vargs) {
            try {
                reaction(vargs)
            } catch (error) {
                this.sink.rescue(error)
            }
        }
    } else {
        this._sink.results.push([])
        this._sink.waiting++
        callback.index = this._sink.results.length - 1
        callback.action = get
    }

    this._sink._listeners.push({
        ee: this._ee,
        name: name,
        listener: callback.listener
    })
    this._ee.on(name, callback.callback)
}

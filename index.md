Funnel EventEmitter events into an error-first callback result.

Delta is part of the [Cadence](https://github.com/bigeasy/cadence) universe. The
examples below use Cadence, but this would also be useful for programming in
Streamline.js or other error-first callback domininate flow-control libraries.

## Delta In a Nutshell

I use Delta to gather the results of `EventEmitter` objects and funnel them into
an error-first callback.

```javascript
var delta = require('delta'), children = require('child_process')

var ps = children.spawn('ps', [ 'ax' ])

var delta = new Delta(function (error, data, code) {
    if (error) throw error
    if (code != 0) {
        throw new Error('ps failed')
    }
    return stdout.join('').split(/\n/).length - 2
})

delta.ee(ps.stdout).on('data', [])
     .ee(ps.stderr).on('data', function (chunk) {
         console.error(chunk.toString())
     })
     .ee(ps).on('close')
```

```javascript
var children = require('child_process'), cadence = require('cadence')

var processCount = cadence(function (async) {
    var ps = children.spawn('ps', [ 'ax' ])
    async(function () {
        new Delta(async())
                .ee(ps.stdout).on('data', [])
                .ee(ps.stderr).on('data', function (chunk) {
                    console.error(chunk.toString())
                })
                .ee(ps).on('close')
    }, function (stdout, code) {
        if (code != 0) {
            throw new Error('ps failed')
        }
        return stdout.join('').split(/\n/).length - 2
    })
})

processCount(function (error, count) {
    if (error) throw error
    console.log('processes: ' + count)
})
```

It is complicated, but not really. Let's look closer at the `processCount`
function to see all the ways in which `Delta` gathers an `EventEmitter`.

```javascript
var processCount = cadence(function (async) {
    // run `ps`
    var ps = children.spawn('ps', [ 'ax' ])

    // gather the output from `ps` and wait for it to finish, count the lines to
    // count the number of processes running on this machine.
    async(function () {
        // wrap a callback in a `Delta` object, the results from the
        // `EventEmitter` are fed to the callback.
        var delta = new Delta(async())

        // gather stdout into an array, the first argument to the callback.
        delta.ee(ps.stdout).on('data', [])

        // set a handler for stderr, no argument is passed to the callback.
        delta.ee(ps.stderr).on('data', function (chunk) {
            console.error(chunk.toString())
        })

        // wait for the process to close, the code and signal are passed to the
        // callback.
        delta.ee(ps).on('close')
    }, function (stdout, code) {
        if (code != 0) {
            throw new Error('ps failed')
        }
        return stdout.join('').split(/\n/).length - 2
    })
})
```

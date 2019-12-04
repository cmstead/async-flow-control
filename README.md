# Async Flow Control #

Manage complex async flow control problems with ease. Promises and callbacks, async/await with try/catch blocks -- these lead to a substantial amount of noise in the code when the flow control structure gets complex. Conditional execution, looping and the like introduce significant overhead you must keep in mind while you work.

There can be a better way.

Async Flow Control (AFC) is a flow control system for handling conditional behaviors in async code. AFC handles callbacks and synchronous calls under a unified interface, without modification or wrappers.

Writing conditional logic in async code can be done in the same number of lines as handling promise resolution:

```javascript
const asyncFlowControl = require('async-flow-control');

asyncFlowControl
    .if(isRemoteFeatureEnabled)
    .then(promiseReturning)

    .elseIf(isCacheable)
    .then(cacheRemoteCall)

    .elseSync(fallbackBehavior)
    
    .exec()
    
    .then(continueExecution)
    .catch(executeErrorBehavior);
```

## Setup ##

To install Async Flow Control, make sure you have a current version of NodeJS installed and run the following command in your project:

`npm i async-flow-control`

## Working With Async Flow Control ##

### Lazy Execution ###

Async Flow Control is designed to execute behaviors lazily.  This means, the entire setup can be done up front and the actual execution can be done at the appropriate time. By executing lazily, you can construct your intended logical path without triggering an immediate cascade of async execution.

On the other hand, this means you must explicitly call `exec` to execute your conditional logic. The following example is kind of silly since it doesn't actually do anything, but I think it illustrates the point.

```javascript
    asyncFlowControl
        .new()
        .exec() // This runs your constructed logic
        
        .then(doSomethingWhenExecutionCompletes)
        .catch(errorHandler);

```

### Promises AND Callbacks ###

The history of async programming in Javascript is long, so we have tools which use callbacks and promises. It's really frustrating to wrap up lots of old API code to match new code patterns. Async Flow Control simply supports both and lets you get on with writing code.

First, Async Flow Control will accept functions which conform to the Node.js callback form `callback(error, ...args)`, and standard promises (Promise/A+).

```javascript
    const checkACondition = 
        () => Promise.resolve(true);
    const maybeDoSomething = 
        (callback) => callback(null, 'It worked!');

    asyncFlowControl
        .if(checkACondition)
        .then(maybeDoSomething)

        .exec()
```

Async Flow Control also allows you to resolve execution with callbacks or promises.  When exec is called, if a function is provided, it will be treated as a callback. If nothing is passed, it returns a promise:

```javascript
    // Callback style resolution
    asyncFlowControl
        .if(checkACondition)
        .then(maybeDoSomething)

        .exec((error, ...args) => 
            console.log('Do stuff here'));
    
    // Promise style resolution
    asyncFlowControl
        .if(checkACondition)
        .then(maybeDoSomething)

        .exec()

        .then((...args) => console.log('Do stuff'))
        .catch((error) => console.log('Oh noes!'));
```

### Simple Conditions ###

At its core, Async Flow Control is an async conditional handler. This means you can build conditional structures without setting your hair on fire.  This means we can do something like the following:

```javascript
asyncFlowControl

    .if(checkDataWasUpdated)
    .then(getLatestData)
    .then(updateCache)

    .else(getCachedData)

    .exec()
```

If, then and else each take a function.  Async Flow Control short circuits execution like a standard conditional, so if `checkDataWasUpdated` returns false, the else function will be executed. All "thens" will be skipped.

### Rich Conditions ###

Although the if/then/else behavior provides a nice base behavior, it's common for conditional logic to quickly become nested, and hard to manage.  We can refine our logic with `elseIf` like below:

```javascript
asyncFlowControl
    .if(cacheIsEmpty)
    .then(getLatestData)
    .then(storeDataInCache)

    .elseIf(checkDataWasUpdated)
    .then(getLatestData)
    .then(updateCache)

    .else(getCachedData)

    .exec()
```

### While Loops ###

```javascript
    let count = 0;

    const checkCount = 
        () => Promise.resolve(count < 3);
    const countUpdate = 
        () => Promise.resolve(++ count);

    asyncFlowControl
        .while(checkCount)
        .then(countUpdate)

        .exec();
```

### Mixing Sync/Async behaviors ###

Every method provided by Async Flow Control has a "sync" counterpart, except `chain` and `exec`.

```javascript
    const thenBehavior1 =
        () => Promise.resolve(5);
    const thenBehavior2 = 
        value => 
            Promise.resolve(value + 3);

    return asyncFlowControl
        .ifSync(() => true)
        .then(thenBehavior1)
        .then(thenBehavior2)
        .thenSync(value => value / 2)

        .exec()
        .then(function (resultSet) {
            console.log(resultSet); // 4
        });
```

### Chaining Functions ###

Chaining functions is especially useful when you need to stitch together behaviors. The best case for this is when your functions use promises and callbacks, or when some behaviors are synchronous and other are async:

```javascript
    const thenBehavior1 = 
        () => Promise.resolve(5);
    const thenBehavior2 = 
        (value, callback) => 
            callback(null, value + 3);

    return asyncFlowControl
        .chain()
        .then(thenBehavior1)
        .then(thenBehavior2)
        .thenSync(value => value / 2)

        .exec()
        .then(function (resultSet) {
            console.log(resultSet);
        });
```
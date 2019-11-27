# Async Flow Control #

Manage complex async flow control problems with ease. Promises and callbacks, async/await with try/catch blocks -- these lead to a substantial amount of noise in the code when the flow control structure gets complex. Conditional execution, looping and the like introduce significant overhead you must keep in mind while you work.

There can be a better way.

Although Async Flow Control is simply a conditional library at the moment, it already packs a lot in. It is possible to easily combine mixed APIs using promises, callbacks and synchronous calls under a unified interface.  Have a look at the following example:

```javascript
const asyncFlowControl = require('async-flow-control');

asyncFlowControl
    .if(isRemoteFeatureEnabled)
    .then(runRemoteFeature)
    .thenSync(transformReturnedData)
    .then(getMoreData)

    .elseIf(isCacheable)
    .then(cacheRemoteCall)

    .elseIfSync(isLocallyRunnable)
    .then(getRemoteCommandValues)

    .elseSync(getLocalNoopCommand)
    
    .exec()
    
    .then(continueExecution)
    .catch(executeErrorBehavior);
```

## Setup ##

To install Async Flow Control, make sure you have a current version of NodeJS installed and run the following command in your project:

`npm i async-flow-control`
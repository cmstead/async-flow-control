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
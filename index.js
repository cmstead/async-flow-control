(function (asyncFlowControlFactory) {
    const isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';

    if (isNode) {
        module.exports = asyncFlowControlFactory();
    } else {
        window.asyncFlowControl = asyncFlowControlFactory();
    }

})(function () {

    function lastIndexOf(values) {
        return values.length - 1;
    }

    function last(values) {
        return values[lastIndexOf(values)];
    }

    function promiseHandler(promiseToHandle, callback) {
        if(typeof promiseToHandle === 'object') {
            promiseToHandle
                .then((...args) => callback.apply(null, [null].concat(args)))
                .catch((error) => callback(error, null));
        }
    }

    function processConditional(conditionalItem, continuation) {

        function testAndCallCurrentBehavior(behaviors) {
            const currentBehavior = behaviors[0];

            function ifResolver(error, testResult) {
                if (error) {
                    continuation(error);
                } else if (testResult) {
                    const thenPromise = currentBehavior.then(continuation);
                    promiseHandler(thenPromise, continuation);
                } else if (behaviors.length > 1) {
                    testAndCallCurrentBehavior(behaviors.slice(1));
                } else {
                    continuation();
                }
            }

            const ifPromise = currentBehavior.if(ifResolver);
            promiseHandler(ifPromise, ifResolver);
        }

        testAndCallCurrentBehavior(conditionalItem.behaviors);
    }

    function asyncify(fn) {
        return function (...args) {
            const continuation = last(args);
            const result = fn.apply(null, args);

            continuation(null, result);
        }
    }

    function AsyncFlowControl(options) {
        this.callSequence = [];
        this.resolvers = [];

        if (typeof options.if === 'function') {
            this.if(options.if);
        }
    }

    function getAndRegisterNewExecPromise(instance) {
        return new Promise(function (resolve, reject) {
            instance.addResolver(function (error, data) {
                if (error) {
                    reject(error);
                } else {
                    resolve(data);
                }
            });
        });
    }

    AsyncFlowControl.prototype = {
        if: function (asyncPredicate) {
            this.callSequence.push({
                type: 'conditional',
                behaviors: [
                    {
                        type: 'if',
                        if: asyncPredicate,
                        then: null
                    }
                ]
            })
            return this;
        },
        else: function (asyncFunction) {
            const currentCallItem = last(this.callSequence);

            currentCallItem.behaviors.push({
                type: 'else',
                if: asyncify(() => true),
                then: asyncFunction
            });

            return this;
        },
        elseIf: function (asyncPredicate) {
            const currentCallItem = last(this.callSequence);

            currentCallItem.behaviors.push(
                {
                    type: 'if',
                    if: asyncPredicate,
                    then: null
                }
            )

            return this;
        },
        then: function (asyncFunction) {
            const currentCallItem = last(this.callSequence);
            const currentBehaviorItem = last(currentCallItem.behaviors);

            currentBehaviorItem.then = asyncFunction;

            return this;
        },
        runAllCallItems: function (continuation) {
            function processNextCallItem(callSequence) {
                const currentCallItem = callSequence[0];

                function postProcessContinuation(error) {
                    if (error) {
                        continuation(error);
                    } else if (callSequence.length > 1) {
                        processNextCallItem(callSequence.slice(1));
                    } else {
                        continuation();
                    }
                }

                processConditional(currentCallItem, postProcessContinuation);
            }

            processNextCallItem(this.callSequence);

        },
        exec: function (resolver) {
            let returnablePromise;

            if (typeof resolver === 'function') {
                this.addResolver(resolver);
            } else {
                returnablePromise = getAndRegisterNewExecPromise(this);
            }

            this.runAllCallItems(function (error){
                this.resolvers.forEach(function (resolver){
                    resolver(error);
                })
            }.bind(this));

            return returnablePromise;
        },
        addResolver: function (action) {
            this.resolvers.push(action);
        }
    }

    function ifAsync(asyncPredicate) {
        return new AsyncFlowControl({ if: asyncPredicate });
    }

    return {
        asyncify: asyncify,
        if: ifAsync
    };
});
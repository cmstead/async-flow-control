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
        if (typeof promiseToHandle === 'object') {
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
                    continuation(error, null);
                } else if (testResult) {
                    const thenPromise = currentBehavior.then(continuation);
                    promiseHandler(thenPromise, continuation);
                } else if (behaviors.length > 1) {
                    testAndCallCurrentBehavior(behaviors.slice(1));
                } else {
                    continuation();
                }
            }

            try {
                const ifPromise = currentBehavior.if(ifResolver);
                promiseHandler(ifPromise, ifResolver);
            } catch (error) {
                continuation(error);
            }
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
        this.resultSet = [];

        const hasOptions = typeof options === 'object';

        if (hasOptions && typeof options.if === 'function') {
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
                behaviors: []
            });

            return this.elseIf(asyncPredicate);
        },
        ifSync: function (predicate) {
            return this.if(asyncify(predicate));
        },
        else: function (asyncFunction) {
            const currentCallItem = last(this.callSequence);

            currentCallItem.behaviors.push({
                if: asyncify(() => true),
                then: asyncFunction
            });

            return this;
        },
        elseSync: function (action) {
            return this.else(asyncify(action));
        },
        elseIf: function (asyncPredicate) {
            const currentCallItem = last(this.callSequence);

            currentCallItem.behaviors.push({
                if: asyncPredicate,
                then: null
            });

            return this;
        },
        elseIfSync: function (predicate) {
            return this.elseIf(asyncify(predicate));
        },
        then: function (asyncFunction) {
            const currentCallItem = last(this.callSequence);
            const currentBehaviorItem = last(currentCallItem.behaviors);

            currentBehaviorItem.then = asyncFunction;

            return this;
        },
        thenSync: function (action) {
            return this.then(asyncify(action));
        },
        runAllCallItems: function (continuation) {
            function processNextCallItem(callSequence) {
                const currentCallItem = callSequence[0];

                function postProcessContinuation(error, result) {
                    if(typeof result !== 'undefined') {
                        this.resultSet.push(result);
                    }
                    if (error) {
                        continuation(error);
                    } else if (callSequence.length > 1) {
                        processNextCallItem(callSequence.slice(1));
                    } else {
                        continuation();
                    }
                }

                processConditional(currentCallItem, postProcessContinuation.bind(this));
            }

            processNextCallItem.call(this, this.callSequence);

        },
        exec: function (resolver) {
            let returnablePromise;

            if (typeof resolver === 'function') {
                this.addResolver(resolver);
            } else {
                returnablePromise = getAndRegisterNewExecPromise(this);
            }

            this.runAllCallItems(function (error) {
                this.resolvers.forEach(function (resolver) {
                    resolver(error, this.resultSet);
                }.bind(this))
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

    function ifSync(predicate) {
        return ifAsync(asyncify(predicate));
    }

    function newInstance() {
        return new AsyncFlowControl();
    }

    return {
        asyncify: asyncify,
        if: ifAsync,
        ifSync: ifSync,
        new: newInstance
    };
});
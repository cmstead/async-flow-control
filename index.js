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
        if (typeof promiseToHandle === 'object'
            && typeof promiseToHandle.then === 'function') {
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
            const continuation = args.pop();

            try {
                const result = fn(...args);
                continuation(null, result);
            } catch (error) {
                continuation(error);
            }
        }
    }

    function AsyncFlowControl(options) {
        this.callSequence = [];
        this.resolvers = [];
        this.resultSet = [];

        const hasOptions = typeof options === 'object';

        if (hasOptions && typeof options.if === 'function') {
            this.if(options.if);
        } else if (hasOptions && Boolean(options.chain)) {
            this.chain(options.chain);
        }
    }

    function defaultAction(callback) {
        callback(null);
    }

    function asyncCompose(original, newAsync) {
        return function (...args) {
            const callback = args.pop();

            function callNext(error, ...nextArgs) {
                if (error) {
                    callback(error);
                } else {
                    const maybePromise = newAsync(...(nextArgs.concat(callback)));
                    promiseHandler(maybePromise, callback);
                }
            }

            const maybePromise = original(...(args.concat(callNext)));
            promiseHandler(maybePromise, callNext);
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
        attachBehavior: function ({
            predicate = asyncify(() => true),
            action = defaultAction
        }) {
            const currentCallItem = last(this.callSequence);

            currentCallItem.behaviors.push({
                if: predicate,
                then: action
            });

            return this;

        },
        chain: function (...initialValues) {
            this.callSequence.push({
                behaviors: []
            });

            const initialAction = (callback) =>
                callback(...([null].concat(initialValues)));

            return this.attachBehavior({
                action: initialAction
            })
        },
        if: function (asyncPredicate) {
            this.callSequence.push({
                behaviors: []
            });

            return this.attachBehavior({
                predicate: asyncPredicate
            });
        },

        ifSync: function (predicate) {
            return this.if(asyncify(predicate));
        },

        else: function (asyncFunction) {
            return this.attachBehavior({
                predicate: asyncify(() => true),
                action: asyncFunction
            });
        },

        elseSync: function (action) {
            return this.else(asyncify(action));
        },

        elseIf: function (asyncPredicate) {
            return this.attachBehavior({
                predicate: asyncPredicate,
                action: defaultAction
            });
        },

        elseIfSync: function (predicate) {
            return this.elseIf(asyncify(predicate));
        },

        then: function (asyncFunction) {
            const currentCallItem = last(this.callSequence);
            const currentBehaviorItem = last(currentCallItem.behaviors);

            const originalThen = currentBehaviorItem.then;
            currentBehaviorItem.then = asyncCompose(
                originalThen,
                asyncFunction
            );

            return this;
        },

        thenSync: function (action) {
            return this.then(asyncify(action));
        },

        runAllCallItems: function (continuation) {
            function processNextCallItem(callSequence) {
                const currentCallItem = callSequence[0];

                function postProcessContinuation(error, result) {
                    if (typeof result !== 'undefined') {
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

            this.runAllCallItems(
                (error) =>
                    this.resolvers.forEach(
                        (resolver) =>
                            resolver(error, this.resultSet)
                    )
            );

            return returnablePromise;
        },

        addResolver: function (action) {
            this.resolvers.push(action);
        }
    }

    function ifAsync(asyncPredicate) {
        return new AsyncFlowControl({ if: asyncPredicate });
    }

    function chain (...args) {
        const flowControlInstance = new AsyncFlowControl();

        flowControlInstance.chain(...args);

        return flowControlInstance;
    }

    function ifSync(predicate) {
        return ifAsync(asyncify(predicate));
    }

    function newInstance() {
        return new AsyncFlowControl();
    }

    return {
        asyncify: asyncify,
        chain: chain,
        if: ifAsync,
        ifSync: ifSync,
        new: newInstance
    };
});
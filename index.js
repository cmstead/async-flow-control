(function (asyncFlowControlFactory) {
    const isNode = typeof module !== 'undefined' && typeof module.exports !== 'undefined';

    if(isNode) {
        module.exports = asyncFlowControlFactory();
    } else {
        window.asyncFlowControl = asyncFlowControlFactory();
    }

})(function () {

    function lastIndexOf (values) {
        return values.length - 1;
    }

    function last (values) {
        return values[lastIndexOf(values)];
    }

    function processConditional(conditionalItem, continuation) {

        function testAndCallCurrentBehavior(behaviors) {
            const currentBehavior = behaviors[0];

            currentBehavior.if(function(error, testResult) {

                if(error) {
                    continuation(error);
                } else if(testResult) {
                    currentBehavior.then(continuation);
                } else {
                    testAndCallCurrentBehavior(behaviors.slice(1));
                }
            });
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
        this.callSequence = [

        ];

        this.resolvers = [
            
        ];

        if(typeof options.if === 'function') {
            this.if(options.if);
        }
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
        elseIf: function(asyncPredicate) {
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
        then: function(asyncFunction) {
            const currentCallItem = last(this.callSequence);
            const currentBehaviorItem = last(currentCallItem.behaviors);

            currentBehaviorItem.then = asyncFunction;

            return this;
        },
        runAllCallItems: function (continuation) {
            function processNextCallItem(callSequence) {
                const currentCallItem = callSequence[0];

                processConditional(currentCallItem, function (error) {
                    if(error) {
                        continuation(error);
                    } else if(callSequence.length > 1) {
                        processNextCallItem(callSequence.slice(1));
                    } else {
                        continuation();
                    }
                });
            }
            
            processNextCallItem(this.callSequence);

        },
        exec: function (resolver) {
            this.addResolver(resolver);

            this.runAllCallItems(function(error) {
                this.resolvers[0](error);
            }.bind(this));
        },
        addResolver: function (action) {
            this.resolvers.push(action);
        }
    }

    function ifAsync (asyncPredicate) {
        return new AsyncFlowControl({ if: asyncPredicate });
    }

    return {
        asyncify: asyncify,
        if: ifAsync
    };
});
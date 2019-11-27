const { assert } = require('chai');

const asyncFlowControl = require('../index');
const { asyncify } = asyncFlowControl;

describe("Behavior Chaining", function(){
    describe("chain", function(){
       
        it('allows multiple then calls from chain', function () {
            const thenBehavior1 = asyncify(() => 5);
            const thenBehavior2 = asyncify(value => value + 3);

            return asyncFlowControl
                .chain()
                .then(thenBehavior1)
                .then(thenBehavior2)
                .thenSync(value => value / 2)

                .exec()
                .then(function (resultSet) {
                    assert.equal(resultSet, 4);
                });
        });

        it('chains functions, starting with initial values', function () {
            const thenBehavior1 = asyncify((a, b) => a + b);
            const thenBehavior2 = asyncify(value => value + 3);

            return asyncFlowControl
                .chain(5, 6)
                .then(thenBehavior1)
                .then(thenBehavior2)
                .thenSync(value => value / 2)

                .exec()
                .then(function (resultSet) {
                    assert.equal(resultSet, 7);
                });
        });

    });
});
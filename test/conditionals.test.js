const { assert } = require('chai');
const sinon = require('sinon');

const asyncFlowControl = require('../index');
const { asyncify } = asyncFlowControl;

function promisify(fn) {
    return function (...args) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                const result = fn.apply(null, args);

                resolve(result);
            });
        })
    }
}

describe("conditionals", function () {

    describe("if", function () {

        it("executes 'then' action provided below it", function (done) {
            const thenStub = sinon.stub();

            asyncFlowControl
                .if(asyncify(() => true))
                .then(asyncify(thenStub))

                .exec(function () {
                    assert.equal(thenStub.callCount, 1, 'ThenStub was called an incorrect number of times');
                    done();
                });
        });

        it("executes 'then' action provided below it on promise resolution", function (done) {
            const thenStub = sinon.stub();

            asyncFlowControl
                .if(promisify(() => true))
                .then(asyncify(thenStub))

                .exec(function () {
                    assert.equal(thenStub.callCount, 1, 'ThenStub was called an incorrect number of times');
                    done();
                });
        });

        it("executes 'then' action as promise when if condition resolves to true", function (done) {
            const thenStub = sinon.stub();

            asyncFlowControl
                .if(promisify(() => true))
                .then(promisify(thenStub))

                .exec(function () {
                    assert.equal(thenStub.callCount, 1, 'ThenStub was called an incorrect number of times');
                    done();
                });
        });

        it("falls all the way through when no conditions are met", function (done) {
            const thenStub = sinon.stub();

            asyncFlowControl
                .if(asyncify(() => false))
                .then(asyncify(thenStub))

                .exec(function () {
                    assert.equal(thenStub.callCount, 0, 'ThenStub was called an incorrect number of times');
                    done();
                });
        });

        it("executes falls through single if to bottom on error in if check", function (done) {
            const thenStub = sinon.stub();

            asyncFlowControl
                .if((continuation) => continuation(new Error('A test error'), true))
                .then(asyncify(thenStub))

                .exec(function (error) {
                    assert.equal(thenStub.callCount, 0, 'ThenStub was called an incorrect number of times');
                    assert.equal(error.message, 'A test error', 'Error not properly managed');
                    done();
                });
        });

        it("executes falls through single if to bottom on error on then execution check", function (done) {
            asyncFlowControl
                .if(asyncify(() => true))
                .then((continuation) => continuation(new Error('Another test error')))

                .exec(function (error) {
                    assert.equal(error.message, 'Another test error', 'Error not properly managed');
                    done();
                });
        });

        it("Runs multiple if structures", function (done) {
            const thenStub1 = sinon.stub();
            const thenStub2 = sinon.stub();

            asyncFlowControl
                .if(asyncify(() => true))
                .then(asyncify(thenStub1))

                .if(asyncify(() => true))
                .then(asyncify(thenStub2))

                .exec(function (error) {

                    assert.equal(thenStub1.callCount, 1, "First then was not called the correct number of times")
                    assert.equal(thenStub2.callCount, 1, "Second then was not called the correct number of times")

                    done();
                });

        });

        it("Falls through to end on any error", function (done) {
            const thenStub1 = sinon.stub();
            const thenStub2 = sinon.stub();

            asyncFlowControl
                .if((continuation) => continuation(new Error("Yet another error")))
                .then(asyncify(thenStub1))

                .if(asyncify(() => true))
                .then(asyncify(thenStub2))

                .exec(function (error) {

                    assert.equal(thenStub1.callCount, 0, "First then was not called the correct number of times")
                    assert.equal(thenStub2.callCount, 0, "Second then was not called the correct number of times")

                    assert.equal(error.message, 'Yet another error', 'Error not properly managed');

                    done();
                });

        });

    });

    describe("ifSync", function () {
        it("resolves a synchronous check and calls through to then", function (done) {
            const thenStub = sinon.stub();

            asyncFlowControl
                .ifSync(() => true)
                .then(asyncify(thenStub))

                .exec(function () {
                    assert.equal(thenStub.callCount, 1, 'ThenStub was called an incorrect number of times');
                    done();
                });

        });
    });

    describe("thenSync", function () {
        it("resolves a synchronous then and calls through to then", function (done) {
            const thenStub = sinon.stub();

            asyncFlowControl
                .ifSync(() => true)
                .thenSync(thenStub)

                .exec(function () {
                    assert.equal(thenStub.callCount, 1, 'ThenStub was called an incorrect number of times');
                    done();
                });

        });
    });

    describe("else", function () {
        it("executes 'then' action provided below it", function (done) {
            const thenStub = sinon.stub();
            const elseStub = sinon.stub();

            asyncFlowControl
                .if(asyncify(() => false))
                .then(asyncify(thenStub))

                .else(asyncify(elseStub))

                .exec(function () {
                    assert.equal(thenStub.callCount, 0, 'ThenStub was called but shouldn\'t have been');
                    assert.equal(elseStub.callCount, 1, 'Else was called an incorrect number of times');
                    done();
                });
        });
    });

    describe("elseSync", function () {
        it("executes 'then' action provided below it", function (done) {
            const thenStub = sinon.stub();
            const elseStub = sinon.stub();

            asyncFlowControl
                .if(asyncify(() => false))
                .then(asyncify(thenStub))

                .elseSync(elseStub)

                .exec(function () {
                    assert.equal(thenStub.callCount, 0, 'ThenStub was called but shouldn\'t have been');
                    assert.equal(elseStub.callCount, 1, 'Else was called an incorrect number of times');
                    done();
                });
        });
    });

    describe("elseIf", function () {
        it("executes 'then' action provided below it", function (done) {
            const ifStub = sinon.stub();
            const elseIfStub = sinon.stub();
            const elseStub = sinon.stub();

            asyncFlowControl
                .if(asyncify(() => false))
                .then(asyncify(ifStub))

                .elseIf(asyncify(() => true))
                .then(asyncify(elseIfStub))

                .else(asyncify(elseStub))

                .exec(function () {
                    assert.equal(ifStub.callCount, 0, 'ThenStub was called but shouldn\'t have been');
                    assert.equal(elseStub.callCount, 0, 'Else was called but should not have been');
                    assert.equal(elseIfStub.callCount, 1, 'ElseIf was called an incorrect number of times');
                    done();
                });
        });
    });

    describe("elseIfSync", function () {
        it("executes 'then' action provided below it", function (done) {
            const ifStub = sinon.stub();
            const elseIfStub = sinon.stub();
            const elseStub = sinon.stub();

            asyncFlowControl
                .if(asyncify(() => false))
                .then(asyncify(ifStub))

                .elseIfSync(() => true)
                .then(asyncify(elseIfStub))

                .else(asyncify(elseStub))

                .exec(function () {
                    assert.equal(ifStub.callCount, 0, 'ThenStub was called but shouldn\'t have been');
                    assert.equal(elseStub.callCount, 0, 'Else was called but should not have been');
                    assert.equal(elseIfStub.callCount, 1, 'ElseIf was called an incorrect number of times');
                    done();
                });
        });
    });

    describe("exec", function () {
        it("catches a thrown error and provides it out to the resolver", function (done) {

            asyncFlowControl
                .if(() => { throw new Error('Execution error'); })
                .exec()
                .then(() => null)
                .catch(function (error) {
                    assert.equal(error.message, 'Execution error');
                    done()
                });
        });

        it("returns a promise and resolves when no callback is provided", function (done) {
            const behaviorPromise = asyncFlowControl.if(asyncify(() => false)).exec();

            behaviorPromise
                .then(function () {
                    assert.isTrue(true, 'This means the promise was properly resolved');
                    done();
                });
        });

        it("returns a promise and rejects properly when an error occurs", function (done) {
            const behaviorPromise = asyncFlowControl
                .if((continuation) => continuation(new Error('Oh noes!!')))
                .exec();

            behaviorPromise
                .then(function () { })
                .catch(function (error) {
                    assert.equal(error.message, 'Oh noes!!', 'Error was not provided correctly');
                    done();
                });
        });

        it("returns collected values when if resolves to true", function(done){
            asyncFlowControl
                .ifSync(() => true)
                .thenSync(() => 'If condition met')
                .exec(function(error, resultSet) {
                    assert.equal(resultSet.length, 1);
                    assert.equal(resultSet[0], 'If condition met');

                    done();
                });
        });

        it('allows multiple then calls from if', function () {
            const thenBehavior1 = asyncify(() => 5);
            const thenBehavior2 = asyncify(value => value + 3);

            return asyncFlowControl
                .ifSync(() => true)
                .then(thenBehavior1)
                .then(thenBehavior2)
                .thenSync(value => value / 2)

                .exec()
                .then(function (resultSet) {
                    assert.equal(resultSet, 4);
                });
        });
    });

});
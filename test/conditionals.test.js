const { assert } = require('chai');
const sinon = require('sinon');
const asyncFlowControl = require('../index');

function lastIndexOf (values) {
    return values.length - 1;
}

function last(values) {
    const lastIndex = lastIndexOf(values);

    return values[lastIndex];
}

function asyncify(fn) {
    return function(...args) {
        const continuation = last(args);
        const otherArgs = args.slice(0, lastIndexOf(args));

        setTimeout(function () {
            const result = fn.apply(null, otherArgs);
            continuation(null, result);
        }, 10);
    };
}

describe("conditionals", function(){
   
    describe("if", function(){
       
        it("executes 'then' action provided below it", function(done){
            const thenStub = sinon.stub();

            asyncFlowControl
                .if(asyncify(() => true))
                .then(asyncify(thenStub))
                
                .exec(function() {
                    assert.equal(thenStub.callCount, 1, 'ThenStub was called an incorrect number of times');
                    done();
                });
        });

        it("executes falls through single if to bottom on error in if check", function(done){
            const thenStub = sinon.stub();

            asyncFlowControl
                .if((continuation) => continuation(new Error('A test error'), true))
                .then(asyncify(thenStub))

                .exec(function(error) {
                    assert.equal(thenStub.callCount, 0, 'ThenStub was called an incorrect number of times');
                    assert.equal(error.message, 'A test error', 'Error not properly managed');
                    done();
                });
        });

        it("executes falls through single if to bottom on error on then execution check", function(done){
            asyncFlowControl
                .if(asyncify(() => true))
                .then((continuation) => continuation(new Error('Another test error')))

                .exec(function(error) {
                    assert.equal(error.message, 'Another test error', 'Error not properly managed');
                    done();
                });
        });

        it("Runs multiple if structures", function(done){
            const thenStub1 = sinon.stub();
            const thenStub2 = sinon.stub();

            asyncFlowControl
                .if(asyncify(() => true))
                .then(asyncify(thenStub1))

                .if(asyncify(() => true))
                .then(asyncify(thenStub2))

                .exec(function(error) {

                    assert.equal(thenStub1.callCount, 1, "First then was not called the correct number of times")
                    assert.equal(thenStub2.callCount, 1, "Second then was not called the correct number of times")

                    done();
                });
            
        });

        it("Falls through to end on any error", function(done){
            const thenStub1 = sinon.stub();
            const thenStub2 = sinon.stub();

            asyncFlowControl
                .if((continuation) => continuation(new Error("Yet another error")))
                .then(asyncify(thenStub1))

                .if(asyncify(() => true))
                .then(asyncify(thenStub2))

                .exec(function(error) {

                    assert.equal(thenStub1.callCount, 0, "First then was not called the correct number of times")
                    assert.equal(thenStub2.callCount, 0, "Second then was not called the correct number of times")

                    assert.equal(error.message, 'Yet another error', 'Error not properly managed');

                    done();
                });
            
        });

    });

    describe("else", function(){
        it("executes 'then' action provided below it", function(done){
            const thenStub = sinon.stub();
            const elseStub = sinon.stub();

            asyncFlowControl
                .if(asyncify(() => false))
                .then(asyncify(thenStub))

                .else(asyncify(elseStub))

                .exec(function() {
                    assert.equal(thenStub.callCount, 0, 'ThenStub was called but shouldn\'t have been');
                    assert.equal(elseStub.callCount, 1, 'Else was called an incorrect number of times');
                    done();
                });
        });
    });

    describe("elseIf", function(){
        it("executes 'then' action provided below it", function(done){
            const ifStub = sinon.stub();
            const elseIfStub = sinon.stub();
            const elseStub = sinon.stub();

            asyncFlowControl
                .if(asyncify(() => false))
                .then(asyncify(ifStub))

                .elseIf(asyncify(() => true))
                .then(asyncify(elseIfStub))

                .else(asyncify(elseStub))

                .exec(function() {
                    assert.equal(ifStub.callCount, 0, 'ThenStub was called but shouldn\'t have been');
                    assert.equal(elseStub.callCount, 0, 'Else was called but should not have been');
                    assert.equal(elseIfStub.callCount, 1, 'ElseIf was called an incorrect number of times');
                    done();
                });
        });
    });

});
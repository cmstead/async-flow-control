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
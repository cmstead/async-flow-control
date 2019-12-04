const { assert } = require('chai');

const asyncFlowControl = require('../index');
const { asyncify } = asyncFlowControl;

describe("Async Looping", function(){

    describe("while", function(){
       
        it("loops until condition comes back false", function(){
            let count = 0;
            const checkCount = asyncify(() => count < 3);
            const countUpdate = () => count ++;

            asyncFlowControl
                .while(checkCount)
                .thenSync(countUpdate)

                .exec();
            assert.equal(count, 3);
        });

        it("supports sync while checking (whileSync)", function(){
            let count = 0;
            const checkCount = () => count < 3;
            const countUpdate = () => count ++;

            asyncFlowControl
                .whileSync(checkCount)
                .thenSync(countUpdate)

                .exec();
            assert.equal(count, 3);
        });

    });

});
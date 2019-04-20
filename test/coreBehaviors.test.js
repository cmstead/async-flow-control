const { assert } = require('chai');
const sinon = require('sinon');
const asyncFlowControl = require('../index');

describe("AsyncFlowControl", function () {
    it("provides a new instance on request", function (done) {
        const flowControlInstance = asyncFlowControl.new()

        flowControlInstance
            .ifSync(() => false)
            .exec(function () {
                done();
            });
    });
});
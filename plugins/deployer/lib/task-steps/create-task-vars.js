'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

class CreateTaskVars {

    constructor(params) {
        this._context = params.context;
    }

    execute(state) {
        return Promise.resolve(
            _.merge({}, state, {taskVars: this._createTaskVars(state)})
        );
    }

    _createTaskVars(state) {
        return {
            deploymentConfig: state.deploymentConfig,
            deploymentOutputs: state.deploymentOutputs,
            taskOutputsFile: this._context.generateTempFile()
        };
    }
}

module.exports = CreateTaskVars;

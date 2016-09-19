'use strict';

const Promise = require('bluebird');

class CreateEnvVars {

    constructor(params) {
        this._context = params.context;
        this._fileWriter = params.fileWriter;
    }

    execute(state) {
        return this._dumpTaskParameters(state).then(files =>
            Object.assign({}, state, {
                envVars: {
                    appResourcesFile: files.appChainOutputsFile,
                    appConfig: JSON.stringify(state.appChainConfig),
                    env: this._context.env.value(),
                    region: state.taskDef.region,
                    taskOutputsFile: this._context.generateTempFile()
                }
            })
        );
    }

    _dumpTaskParameters(state) {
        const params = [state.appChainOutputs];
        const promises = params.map(c => this._dumpTempFile(c));
        return Promise.all(promises).then(files => ({appChainOutputsFile: files[0]}));
    }

    _dumpTempFile(contents) {
        const file = this._context.generateTempFile();
        return this._fileWriter.writeJson(file, contents).then(() => file);
    }
}

module.exports = CreateEnvVars;

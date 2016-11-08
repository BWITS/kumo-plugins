'use strict';

const _ = require('lodash');

class DeploymentScriptExecutor {

    constructor(params) {
        this._context = params.context;
        this._envVarsFormatter = params.envVarsFormatter;
        this._scriptExecutor = params.scriptExecutor;
    }

    execute(scriptDef, options) {
        let envVars = Object.assign(this._defaultEnvVars(), scriptDef.envVars);
        envVars = this._flattenEnvVars(envVars);
        options = Object.assign({}, options, {envVars});
        return this._scriptExecutor.execute(scriptDef.script, options);
    }

    _defaultEnvVars() {
        // TODO: Format arg keys to camelcase
        return this._envVarsFormatter.format(
            Object.assign(this._context.env.toVars(), this._context.args)
        );
    }

    _flattenEnvVars(envVars) {
        return _.mapValues(envVars,
            v => _.isPlainObject(v) ? JSON.stringify(v) : v
        );
    }
}

module.exports = DeploymentScriptExecutor;

'use strict';

const runScript = require('command-promise');
const AwsHelpers = require('../../../common-lib/aws-helpers');
const DeleteCfStackStep = require('./task-steps/delete-cf-stack');
const CollectTaskOutputsStep = require('./task-steps/collect-task-outputs');
const CreateEnvVarsStep = require('./task-steps/create-env-vars');
const CreateCfEnvVarsStep = require('./task-steps/create-cf-env-vars');
const ExecuteScriptStep = require('./task-steps/execute-script');
const EnvVarsFormatter = require('../../../common-lib/env-vars-formatter');
const JsonCompatibleFileReader = require('../../../common-lib/json-compatible-file-reader');
const JsonSchemaHelper = require('../../../common-lib/json-schema-helper');
const ProvisionCfStackStep = require('./task-steps/provision-cf-stack');
const ResolveCfStackParamsStep = require('./task-steps/resolve-cf-stack-params');
const ScriptExecutor = require('../../../common-lib/script-executor');
const StepsExecutor = require('../../../common-lib/steps-executor');
const StackNameExpander = require('./stack-name-expander');

class TaskFactory {

    constructor(params) {
        this._context = params.context;
    }

    createTask(params) {
        return this._createTask(params, () => ({
            'cf-stack': this._cfTaskSteps,
            custom: this._customTaskSteps
        }));
    }

    createUndoTask(params) {
        return this._createTask(params, () => ({
            'cf-stack': this._undoCfTaskSteps,
            custom: this._undoCustomTaskSteps
        }));
    }

    _createTask(params, getStepCreators) {
        const stepCreators = getStepCreators();
        const stepCreator = stepCreators[params.taskDef.type];
        const steps = stepCreator.call(this);
        return new StepsExecutor({initialState: params, steps: steps});
    }

    _cfTaskSteps() {
        return [
            this._createEnvVarsStep(),
            this._createCfEnvVarsStep(),
            this._executeScriptStep('stackTemplateScript'),
            this._resolveCfStackParamsStep(),
            this._provisionCfStackStep()
        ];
    }

    _customTaskSteps() {
        return [
            this._createEnvVarsStep(),
            this._executeScriptStep('runScript'),
            this._collectTaskOutputsStep()
        ];
    }

    _undoCfTaskSteps() {
        return [this._deleteCfStackStep()];
    }

    _undoCustomTaskSteps() {
        return [
            this._createEnvVarsStep(),
            this._executeScriptStep('undoScript')
        ];
    }

    _createEnvVarsStep() {
        const context = this._context;
        return new CreateEnvVarsStep({context});
    }

    _createCfEnvVarsStep() {
        const context = this._context;
        return new CreateCfEnvVarsStep({context});
    }

    _collectTaskOutputsStep() {
        const fileReader = this._fileReader();
        return new CollectTaskOutputsStep({fileReader});
    }

    _deleteCfStackStep() {
        const awsHelpers = this._awsHelpers();
        const context = this._context;
        const stackNameExpander = this._stackNameExpander();
        return new DeleteCfStackStep({awsHelpers, context, stackNameExpander});
    }

    _executeScriptStep(scriptKey) {
        const context = this._context;
        const scriptExecutor = this._scriptExecutor(context);
        return new ExecuteScriptStep({context, scriptExecutor, scriptKey});
    }

    _resolveCfStackParamsStep() {
        const context = this._context;
        const jsonSchemaHelper = new JsonSchemaHelper();
        return new ResolveCfStackParamsStep({context, jsonSchemaHelper});
    }

    _provisionCfStackStep() {
        const awsHelpers = this._awsHelpers();
        const context = this._context;
        const fileReader = this._fileReader();
        const stackNameExpander = this._stackNameExpander();
        return new ProvisionCfStackStep({awsHelpers, context, fileReader, stackNameExpander});
    }

    _fileReader() {
        return new JsonCompatibleFileReader();
    }

    _stackNameExpander() {
        return new StackNameExpander({context: this._context});
    }

    _scriptExecutor(context) {
        const logger = context.logger;
        const options = {envVarsFormatter: new EnvVarsFormatter({})};
        return new ScriptExecutor({logger, runScript, options});
    }

    _awsHelpers() {
        return new AwsHelpers();
    }
}

module.exports = TaskFactory;
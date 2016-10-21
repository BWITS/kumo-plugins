'use strict';

const runScript = require('command-promise');
const AwsHelpers = require('../../../common-lib/aws-helpers');
const ModuleChainBuilder = require('./module-chain-builder');
const CollectDeploymentOutputsStep = require('./action-steps/collect-deployment-outputs');
const CollectDeploymentConfigStep = require('./action-steps/collect-deployment-config');
const CreateOutputsBucketStep = require('./action-steps/create-outputs-bucket');
const DirChainBuilder = require('../../../common-lib/dir-chain-builder');
const ExpandTaskDefsStep = require('./action-steps/expand-task-defs');
const ExecuteTasksStep = require('./action-steps/execute-tasks');
const EnvVarsFormatter = require('../../../common-lib/env-vars-formatter');
const JsonCompatibleFileReader = require('../../../common-lib/json-compatible-file-reader');
const OutputsStoreFactory = require('./outputs-store-factory');
const SanitizeOutputsStep = require('./action-steps/sanitize-outputs');
const ScriptExecutor = require('../../../common-lib/script-executor');
const StepsExecutor = require('../../../common-lib/steps-executor');
const TaskFactory = require('./task-factory');
const TaskService = require('./task-service');
const UndoTasksStep = require('./action-steps/undo-tasks');

class ActionFactory {

    createDeployAction(context) {
        return new StepsExecutor({
            steps: [
                this._createOutputsBucketStep(context),
                this._collectDeploymentOutputsStep(context),
                this._collectDeploymentConfigStep(context),
                this._expandTaskDefsStep(context),
                this._executeTasksStep(context),
                this._sanitizeOutputsStep(context)
            ]
        });
    }

    createDestroyAction(context) {
        return new StepsExecutor({
            steps: [
                this._collectDeploymentOutputsStep(context),
                this._collectDeploymentConfigStep(context),
                this._expandTaskDefsStep(context),
                this._undoTasksStep(context)
            ]
        });
    }

    _createOutputsBucketStep(context) {
        const awsHelpers = this._awsHelpers();
        return new CreateOutputsBucketStep({awsHelpers, context});
    }

    _collectDeploymentOutputsStep(context) {
        const moduleChainBuilder = this._moduleChainBuilder(context);
        const outputsStoreFactory = this._outputsStoreFactory();
        return new CollectDeploymentOutputsStep({context, moduleChainBuilder, outputsStoreFactory});
    }

    _collectDeploymentConfigStep(context) {
        const moduleChainBuilder = this._moduleChainBuilder(context);
        const scriptExecutor = this._scriptExecutor(context);
        return new CollectDeploymentConfigStep({context, moduleChainBuilder, scriptExecutor});
    }

    _expandTaskDefsStep(context) {
        return new ExpandTaskDefsStep({context});
    }

    _executeTasksStep(context) {
        const taskService = this._taskService(context);
        return new ExecuteTasksStep({context, taskService});
    }

    _undoTasksStep(context) {
        const taskService = this._taskService(context);
        return new UndoTasksStep({taskService});
    }

    _sanitizeOutputsStep(context) {
        const outputsStoreFactory = this._outputsStoreFactory();
        return new SanitizeOutputsStep({context, outputsStoreFactory});
    }

    _moduleChainBuilder(context) {
        const fileReader = this._fileReader();
        const dirChainBuilder = new DirChainBuilder({fileReader});
        return new ModuleChainBuilder({context, dirChainBuilder, fileReader});
    }

    _scriptExecutor(context) {
        const logger = context.logger;
        const options = {envVarsFormatter: new EnvVarsFormatter({})};
        return new ScriptExecutor({logger, runScript, options});
    }

    _taskFactory(context) {
        return new TaskFactory({context});
    }

    _taskService(context) {
        const outputsStoreFactory = this._outputsStoreFactory();
        const taskFactory = this._taskFactory(context);
        return new TaskService({context, outputsStoreFactory, taskFactory});
    }

    _awsHelpers() {
        return new AwsHelpers();
    }

    _fileReader() {
        return new JsonCompatibleFileReader();
    }

    _outputsStoreFactory() {
        const awsHelpers = this._awsHelpers();
        return new OutputsStoreFactory({awsHelpers});
    }
}

module.exports = ActionFactory;
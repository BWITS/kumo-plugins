
'use strict';

const JSZip = require('jszip');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const runScript = require('command-promise');

const AwsHelpers = require('../../../common-lib/aws-helpers');
const StepsExecutor = require('../../../common-lib/steps-executor');
const CreateUploadBucketStep = require('./steps/create-upload-bucket');
const PackageLambdasStep = require('./steps/package-lambdas');
const LambdaPackager = require('./lambda-packager');
const UploadLambdasStep = require('./steps/upload-lambdas');
const OutputPackageLocationsStep = require('./steps/output-package-locations');
const PackageNameBuilder = require('./package-name-builder');
const ZipHelper = require('./zip-helper');
const EnvVarsFormatter = require('../../../common-lib/env-vars-formatter');
const ScriptExecutor = require('../../../common-lib/script-executor');

class ActionFactory {

    createUploadLambdaAction(context) {
        return new StepsExecutor({
            steps: [
                this._createUploadBucketStep(context),
                this._createPackageLambdasStep(context),
                this._createUploadLambdasStep(context),
                this._createOutputPackageLocationsStep(context)
            ]
        });
    }

    _createUploadBucketStep(context) {
        return new CreateUploadBucketStep({
            awsHelpers: this._getAwsHelpers(),
            context
        });
    }

    _createPackageLambdasStep(context) {
        return new PackageLambdasStep({
            context,
            lambdaPackager: this._createLambdaPackager(context)
        });
    }

    _createUploadLambdasStep(context) {
        return new UploadLambdasStep({
            awsHelpers: this._getAwsHelpers(),
            context
        });
    }

    _createOutputPackageLocationsStep(context) {
        return new OutputPackageLocationsStep({context, fs});
    }

    _createLambdaPackager(context) {
        return new LambdaPackager({
            packageNameBuilder: this._createPackageNameBuilder(context.settings),
            scriptExecutor: this._createScriptExecutor(context.logger),
            zipHelper: this._createZipHelper()
        });
    }

    _createPackageNameBuilder(settings) {
        const args = settings.args;
        return new PackageNameBuilder({
            env: args.env,
            buildNumber: args.build_number
        });
    }

    _createScriptExecutor(logger) {
        const options = {envVarsFormatter: new EnvVarsFormatter({})};
        return new ScriptExecutor({logger, runScript, options});
    }

    _createZipHelper() {
        return new ZipHelper({
            createJSZip: () => new JSZip(),
            fs
        });
    }

    _getAwsHelpers() {
        this._awsHelpers = this._awsHelpers || new AwsHelpers();
        return this._awsHelpers;
    }

}

module.exports = ActionFactory;
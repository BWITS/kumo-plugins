'use strict';

const ActionFactory = require('./lib/action-factory');
const actionFactory = new ActionFactory();

module.exports = {
    actions: () => [
        {
            name: 'deploy-app',
            execute: params => actionFactory.createDeployAction(params).execute()
        }
    ]
};
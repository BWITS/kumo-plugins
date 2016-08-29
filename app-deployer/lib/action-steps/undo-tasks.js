'use strict';

class UndoTasks {

    constructor(params) {
        this._taskUndoer = params.taskUndoer;
    }

    execute(state) {
        return this._undoTasks(state).then(() => state);
    }

    _undoTasks(state) {
        const appChainOutputs = state.appChainOutputs;
        return state.taskDefs.reverse().reduce((promise, taskDef) => {
            return promise.then(() => this._taskUndoer.undo(taskDef, appChainOutputs));
        }, Promise.resolve());
    }
}

module.exports = UndoTasks;
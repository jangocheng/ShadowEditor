import { UI } from '../../third_party';
import AddObjectCommand from '../../command/AddObjectCommand';
import RemoveObjectCommand from '../../command/RemoveObjectCommand';

/**
 * 编辑菜单
 * @author tengge / https://github.com/tengge1
 * @param {*} options 
 */
function EditMenu(options) {
    UI.Control.call(this, options);
    this.app = options.app;
}

EditMenu.prototype = Object.create(UI.Control.prototype);
EditMenu.prototype.constructor = EditMenu;

EditMenu.prototype.render = function () {
    var _this = this;

    var container = UI.create({
        xtype: 'div',
        parent: this.parent,
        cls: 'menu',
        children: [{
            xtype: 'div',
            cls: 'title',
            html: '编辑'
        }, {
            xtype: 'div',
            cls: 'options',
            children: [{
                xtype: 'div',
                id: 'undo',
                scope: this.id,
                html: '撤销(Ctrl+Z)',
                cls: 'option inactive',
                onClick: this.undo.bind(this)
            }, {
                xtype: 'div',
                id: 'redo',
                scope: this.id,
                html: '重做(Ctrl+Shift+Z)',
                cls: 'option inactive',
                onClick: this.redo.bind(this)
            }, {
                xtype: 'div',
                id: 'clearHistory',
                scope: this.id,
                html: '清空历史记录',
                cls: 'option inactive',
                onClick: this.clearHistory.bind(this)
            }, {
                xtype: 'hr'
            }, {
                xtype: 'div',
                id: 'clone',
                scope: this.id,
                html: '复制',
                cls: 'option inactive',
                onClick: this.clone.bind(this)
            }, {
                xtype: 'div',
                id: 'delete',
                scope: this.id,
                html: '删除(Del)',
                cls: 'option inactive',
                onClick: this.delete.bind(this)
            }]
        }]
    });

    container.render();

    this.app.on(`historyChanged.${this.id}`, this.onHistoryChanged.bind(this));
    this.app.on(`objectSelected.${this.id}`, this.onObjectSelected.bind(this));
}

// --------------------- 撤销 --------------------------

EditMenu.prototype.undo = function () {
    var history = this.app.editor.history;
    if (history.undos.length === 0) {
        return;
    }

    this.app.editor.undo();
};

// --------------------- 重做 -----------------------------

EditMenu.prototype.redo = function () {
    var history = this.app.editor.history;
    if (history.redos.length === 0) {
        return;
    }

    this.app.editor.redo();
};

// -------------------- 清空历史记录 --------------------------------

EditMenu.prototype.clearHistory = function () {
    var editor = this.app.editor;
    var history = editor.history;

    if (history.undos.length === 0 && history.redos.length === 0) {
        return;
    }

    UI.confirm('询问', '撤销/重做历史记录将被清空。确定吗？', function (event, btn) {
        if (btn === 'ok') {
            editor.history.clear();
        }
    });
};

// -------------------------- 复制 -----------------------------------

EditMenu.prototype.clone = function () {
    var editor = this.app.editor;
    var object = editor.selected;

    if (object == null || object.parent == null) { // 避免复制场景或相机
        return;
    }

    object = object.clone();
    editor.execute(new AddObjectCommand(object));
};

// ----------------------- 删除 -----------------------------------

EditMenu.prototype.delete = function () {
    var editor = this.app.editor;
    var object = editor.selected;

    if (object == null || object.parent == null) { // 避免删除场景或相机
        return;
    }

    UI.confirm('询问', '删除 ' + object.name + '?', function (event, btn) {
        if (btn === 'ok') {
            editor.execute(new RemoveObjectCommand(object));
        }
    });
};

// ---------------------- 事件 -----------------------

EditMenu.prototype.onHistoryChanged = function () {
    var history = this.app.editor.history;

    var undo = UI.get('undo', this.id);
    var redo = UI.get('redo', this.id);
    var clearHistory = UI.get('clearHistory', this.id);

    if (history.undos.length === 0) {
        undo.dom.classList.add('inactive');
    } else {
        undo.dom.classList.remove('inactive');
    }

    if (history.redos.length === 0) {
        redo.dom.classList.add('inactive');
    } else {
        redo.dom.classList.remove('inactive');
    }

    if (history.undos.length === 0 && history.redos.length === 0) {
        clearHistory.dom.classList.add('inactive');
    } else {
        clearHistory.dom.classList.remove('inactive');
    }
};

EditMenu.prototype.onObjectSelected = function () {
    var editor = this.app.editor;

    var clone = UI.get('clone', this.id);
    var deleteBtn = UI.get('delete', this.id);

    if (editor.selected && editor.selected.parent != null) {
        clone.dom.classList.remove('inactive');
        deleteBtn.dom.classList.remove('inactive');
    } else {
        clone.dom.classList.add('inactive');
        deleteBtn.dom.classList.add('inactive');
    }
};

export default EditMenu;
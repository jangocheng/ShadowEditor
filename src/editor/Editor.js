﻿import Config from '../core/Config';
import Signal from '../core/Signal';
import History from '../core/History';
import Storage from '../core/Storage';
import Loader from '../core/Loader';
import Ajax from '../utils/Ajax';
import SceneUtils from '../utils/SceneUtils';

/**
 * @author mrdoob / http://mrdoob.com/
 */

function Editor(app) {
    this.app = app;

    this.DEFAULT_CAMERA = new THREE.PerspectiveCamera(50, 1, 0.1, 10000);
    this.DEFAULT_CAMERA.name = 'Camera';
    this.DEFAULT_CAMERA.position.set(20, 10, 20);
    this.DEFAULT_CAMERA.lookAt(new THREE.Vector3());

    this.config = new Config('threejs-editor');
    this.signals = new Signal();
    this.history = new History(this);
    this.storage = new Storage();
    this.loader = new Loader(this);

    this.camera = this.DEFAULT_CAMERA.clone();

    this.scene = new THREE.Scene();
    this.scene.name = 'Scene';
    this.scene.background = new THREE.Color(0xaaaaaa);

    this.sceneHelpers = new THREE.Scene();

    this.object = {};
    this.geometries = {};
    this.materials = {};
    this.textures = {};
    this.scripts = {};

    this.selected = null;
    this.helpers = {};

};

Editor.prototype = {

    setTheme: function (value) { // 设置主题
        this.app.call('setTheme', this, value);
    },

    setScene: function (scene) { // 设置场景
        this.app.call('setScene', this, scene);
    },

    addObject: function (object) { // 添加物体
        this.app.call('addObject', this, object);
    },

    moveObject: function (object, parent, before) { // 移动物体
        this.app.call('moveObject', this, object, parent, before);
    },

    nameObject: function (object, name) { // 重命名物体
        this.app.call('nameObject', this, object, name);
    },

    removeObject: function (object) {

        if (object.parent === null) return; // avoid deleting the camera or scene

        var scope = this;

        object.traverse(function (child) {

            scope.removeHelper(child);

        });

        object.parent.remove(object);

        this.signals.objectRemoved.dispatch(object);
        this.signals.sceneGraphChanged.dispatch();

    },

    addGeometry: function (geometry) {

        this.geometries[geometry.uuid] = geometry;

    },

    setGeometryName: function (geometry, name) {

        geometry.name = name;
        this.signals.sceneGraphChanged.dispatch();

    },

    addMaterial: function (material) {

        this.materials[material.uuid] = material;

    },

    setMaterialName: function (material, name) {

        material.name = name;
        this.signals.sceneGraphChanged.dispatch();

    },

    addTexture: function (texture) {

        this.textures[texture.uuid] = texture;

    },

    //

    addHelper: function () {

        var geometry = new THREE.SphereBufferGeometry(2, 4, 2);
        var material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            visible: false
        });

        return function (object) {

            var helper;

            if (object instanceof THREE.Camera) {

                helper = new THREE.CameraHelper(object, 1);

            } else if (object instanceof THREE.PointLight) {

                helper = new THREE.PointLightHelper(object, 1);

            } else if (object instanceof THREE.DirectionalLight) {

                helper = new THREE.DirectionalLightHelper(object, 1);

            } else if (object instanceof THREE.SpotLight) {

                helper = new THREE.SpotLightHelper(object, 1);

            } else if (object instanceof THREE.HemisphereLight) {

                helper = new THREE.HemisphereLightHelper(object, 1);

            } else if (object instanceof THREE.SkinnedMesh) {

                helper = new THREE.SkeletonHelper(object);

            } else {

                // no helper for this object type
                return;

            }

            var picker = new THREE.Mesh(geometry, material);
            picker.name = 'picker';
            picker.userData.object = object;
            helper.add(picker);

            this.sceneHelpers.add(helper);
            this.helpers[object.id] = helper;

            this.signals.helperAdded.dispatch(helper);

        };

    }(),

    removeHelper: function (object) {

        if (this.helpers[object.id] !== undefined) {

            var helper = this.helpers[object.id];
            helper.parent.remove(helper);

            delete this.helpers[object.id];

            this.signals.helperRemoved.dispatch(helper);

        }

    },

    //

    addScript: function (object, script) {

        if (this.scripts[object.uuid] === undefined) {

            this.scripts[object.uuid] = [];

        }

        this.scripts[object.uuid].push(script);

        this.signals.scriptAdded.dispatch(script);

    },

    removeScript: function (object, script) {

        if (this.scripts[object.uuid] === undefined) return;

        var index = this.scripts[object.uuid].indexOf(script);

        if (index !== -1) {

            this.scripts[object.uuid].splice(index, 1);

        }

        this.signals.scriptRemoved.dispatch(script);

    },

    //

    select: function (object) {

        if (this.selected === object) return;

        var uuid = null;

        if (object !== null) {

            uuid = object.uuid;

        }

        this.selected = object;

        this.config.setKey('selected', uuid);
        this.signals.objectSelected.dispatch(object);

    },

    selectById: function (id) {

        if (id === this.camera.id) {

            this.select(this.camera);
            return;

        }

        this.select(this.scene.getObjectById(id, true));

    },

    selectByUuid: function (uuid) {

        var scope = this;

        this.scene.traverse(function (child) {

            if (child.uuid === uuid) {

                scope.select(child);

            }

        });

    },

    deselect: function () {

        this.select(null);

    },

    focus: function (object) {

        this.signals.objectFocused.dispatch(object);

    },

    focusById: function (id) {

        this.focus(this.scene.getObjectById(id, true));

    },

    clear: function () {

        this.history.clear();
        this.storage.clear();

        this.camera.copy(this.DEFAULT_CAMERA);
        this.scene.background.setHex(0xaaaaaa);
        this.scene.fog = null;

        var objects = this.scene.children;

        while (objects.length > 0) {

            this.removeObject(objects[0]);

        }

        this.geometries = {};
        this.materials = {};
        this.textures = {};
        this.scripts = {};

        this.deselect();

        this.signals.editorCleared.dispatch();

    },

    load: function () {
        alert('开发中');
    },

    save: function () {
        var obj = SceneUtils.toJSON(this.scene);
        Ajax.post(this.app.options.server + '/Service/SceneService.ashx?cmd=Save', {
            name: 'Scene1',
            data: JSON.stringify(obj)
        }, function (result) {
            var obj = JSON.parse(result);
            alert(obj.Msg);
        });
    },

    //

    fromJSON: function (json) {

        var loader = new THREE.ObjectLoader();

        // backwards

        if (json.scene === undefined) {

            this.setScene(loader.parse(json));
            return;

        }

        var camera = loader.parse(json.camera);

        this.camera.copy(camera);
        this.camera.aspect = this.DEFAULT_CAMERA.aspect;
        this.camera.updateProjectionMatrix();

        this.history.fromJSON(json.history);
        this.scripts = json.scripts;

        this.setScene(loader.parse(json.scene));

    },

    toJSON: function () {

        // scripts clean up

        var scene = this.scene;
        var scripts = this.scripts;

        for (var key in scripts) {

            var script = scripts[key];

            if (script.length === 0 || scene.getObjectByProperty('uuid', key) === undefined) {

                delete scripts[key];

            }

        }

        //

        return {

            metadata: {},
            project: {
                gammaInput: this.config.getKey('project/renderer/gammaInput'),
                gammaOutput: this.config.getKey('project/renderer/gammaOutput'),
                shadows: this.config.getKey('project/renderer/shadows'),
                vr: this.config.getKey('project/vr')
            },
            camera: this.camera.toJSON(),
            scene: this.scene.toJSON(),
            scripts: this.scripts,
            history: this.history.toJSON()

        };

    },

    objectByUuid: function (uuid) {

        return this.scene.getObjectByProperty('uuid', uuid, true);

    },

    execute: function (cmd, optionalName) {

        this.history.execute(cmd, optionalName);

    },

    undo: function () {

        this.history.undo();

    },

    redo: function () {

        this.history.redo();

    }

};

export default Editor;
import Control from './Control';

/**
 * 水平线
 * @param {*} options 
 */
function HorizontalRule(options) {
    Control.call(this, options);
    options = options || {};

    this.cls = options.cls || 'HorizontalRule';
};

HorizontalRule.prototype = Object.create(Control.prototype);
HorizontalRule.prototype.constructor = HorizontalRule;

HorizontalRule.prototype.render = function () {
    this.dom = document.createElement('hr');

    this.dom.className = this.cls;

    this.parent.appendChild(this.dom);
};

export default HorizontalRule;
class BaseWidget {
  constructor(wrapperElement, initialValue) {
    const thisWidget = this;

    thisWidget.dom = {};
    thisWidget.dom.wrapper = wrapperElement;

    thisWidget.correctValue = initialValue;

    if (typeof thisWidget.getElements === 'function') {
      thisWidget.getElements();
    }

    thisWidget.value = initialValue;

    if (typeof thisWidget.initActions === 'function') {
      thisWidget.initActions();
    }
  }

  get value() {
    const thisWidget = this;

    return thisWidget.correctValue;
  }

  set value(value) {
    const thisWidget = this;

    const newValue = parseInt(value);

    if (thisWidget.isValid(newValue)) {
      if (thisWidget.correctValue !== newValue) {
        thisWidget.correctValue = newValue;
        thisWidget.renderValue();
        thisWidget.dom.wrapper.dispatchEvent(new CustomEvent('updated', { bubbles: true }));
      } else {
        thisWidget.renderValue();
      }
    } else {
      thisWidget.renderValue();
    }
  }

  setValue(value) {
    const thisWidget = this;

    thisWidget.value = value;
  }

  parsedValue(value) {
    return parseInt(value);
  }

  isValid(value) {
    return !isNaN(value);
  }

  renderValue() {
    const thisWidget = this;

    thisWidget.dom.wrapper.innerHTML = thisWidget.value;
  }

  announce() {
    const thisWidget = this;

    const event = new CustomEvent('updated', { bubbles: true });
    thisWidget.dom.wrapper.dispatchEvent(event);
  }
}

export default BaseWidget;

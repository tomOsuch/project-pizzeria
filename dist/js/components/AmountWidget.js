import { select, settings } from '../settings.js';

class AmountWidget {
  constructor(element) {
    const thisWidget = this;

    thisWidget.element = element;

    thisWidget.getElements(element);

    const inputValue = thisWidget.input.value;
    let initialValue = settings.amountWidget.defaultValue;

    if (inputValue !== '' && !isNaN(parseInt(inputValue))) {
      const parsedValue = parseInt(inputValue);
      if (parsedValue >= settings.amountWidget.minValue && parsedValue <= settings.amountWidget.maxValue) {
        initialValue = parsedValue;
      }
    }

    thisWidget.setValue(initialValue);
    thisWidget.initActions();
  }

  getElements(element) {
    const thisWidget = this;

    thisWidget.input = element.querySelector(select.widgets.amount.input);
    thisWidget.linkDecrease = element.querySelector(select.widgets.amount.linkDecrease);
    thisWidget.linkIncrease = element.querySelector(select.widgets.amount.linkIncrease);
  }

  initActions() {
    const thisWidget = this;

    thisWidget.input.addEventListener('change', function () {
      thisWidget.setValue(thisWidget.input.value);
    });

    thisWidget.linkDecrease.addEventListener('click', function (event) {
      event.preventDefault();
      thisWidget.setValue(thisWidget.value - 1);
    });

    thisWidget.linkIncrease.addEventListener('click', function (event) {
      event.preventDefault();
      thisWidget.setValue(thisWidget.value + 1);
    });
  }

  setValue(value) {
    const thisWidget = this;

    const newValue = parseInt(value);

    if (!isNaN(newValue) && newValue >= settings.amountWidget.minValue && newValue <= settings.amountWidget.maxValue) {
      if (thisWidget.value !== newValue) {
        thisWidget.value = newValue;
        thisWidget.input.value = thisWidget.value;
        thisWidget.element.dispatchEvent(new CustomEvent('updated', { bubbles: true }));
      } else {
        thisWidget.input.value = thisWidget.value;
      }
    } else {
      thisWidget.input.value = thisWidget.value;
    }
  }
}

export default AmountWidget;

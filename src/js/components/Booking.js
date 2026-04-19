import { select, templates, settings, classNames } from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from '../utils.js';

class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.selectedTable = null;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.initTables();
    thisBooking.getData();
  }

  showTableMessage(message) {
    const thisBooking = this;

    if (!thisBooking.dom.tableMessage) {
      return;
    }

    thisBooking.dom.tableMessage.textContent = message;
    thisBooking.dom.tableMessage.classList.add('visible');
  }

  clearTableMessage() {
    const thisBooking = this;

    if (!thisBooking.dom.tableMessage) {
      return;
    }

    thisBooking.dom.tableMessage.textContent = '';
    thisBooking.dom.tableMessage.classList.remove('visible');
  }

  validateBooking() {
    const thisBooking = this;
    const errors = [];

    const date = thisBooking.datePickerWidget.value;
    const hour = thisBooking.hourPickerWidget.value;
    const people = thisBooking.peopleAmountWidget.value;
    const duration = thisBooking.hoursAmountWidget.value;
    const phone = thisBooking.dom.phone.value.trim();
    const email = thisBooking.dom.address.value.trim();

    if (!date) {
      errors.push('Wybierz date.');
    }

    if (!hour) {
      errors.push('Wybierz godzine.');
    }

    if (isNaN(people) || Number(people) < 1) {
      errors.push('Liczba osob musi byc wieksza od 0.');
    }

    if (isNaN(duration) || Number(duration) < 0.5) {
      errors.push('Czas rezerwacji musi byc co najmniej 0.5h.');
    }

    if (!phone || !/^\+?[0-9\s-]{6,}$/.test(phone)) {
      errors.push('Podaj poprawny numer telefonu.');
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      errors.push('Podaj poprawny adres e-mail.');
    }

    if (!Number.isInteger(thisBooking.selectedTable)) {
      errors.push('Prosze wybrac stolik.');
    }

    if (errors.length) {
      thisBooking.showTableMessage(errors.join(' '));
      return null;
    }

    thisBooking.clearTableMessage();

    return {
      date,
      hour,
      table: thisBooking.selectedTable,
      duration,
      ppl: people,
      phone,
      address: email,
      starters: [],
    };
  }

  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePickerWidget.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePickerWidget.maxDate);

    const params = {
      booking: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };

    console.log('params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&'),
    };
    console.log('urls', urls);

    Promise.all([fetch(urls.booking), fetch(urls.eventsCurrent), fetch(urls.eventsRepeat)])
      .then(function (allResponses) {
        const bookingResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];

        return Promise.all([bookingResponse.json(), eventsCurrentResponse.json(), eventsRepeatResponse.json()]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePickerWidget.minDate;
    const maxDate = thisBooking.datePickerWidget.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    console.log('thisBooking.booked', thisBooking.booked);
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePickerWidget.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPickerWidget.value);
    thisBooking.clearTableMessage();

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (!allAvailable && thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)) {
        table.classList.add(classNames.booking.tableBooked);
        table.classList.remove(classNames.booking.tableSelected);

        if (thisBooking.selectedTable === tableId) {
          thisBooking.selectedTable = null;
        }
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  initTables() {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', function () {
        if (table.classList.contains(classNames.booking.tableBooked)) {
          thisBooking.showTableMessage('Ten stolik jest juz zarezerwowany w wybranym terminie.');
          return;
        }

        thisBooking.clearTableMessage();

        if (table.classList.contains(classNames.booking.tableSelected)) {
          table.classList.remove(classNames.booking.tableSelected);
          thisBooking.selectedTable = null;
          return;
        }

        for (let otherTable of thisBooking.dom.tables) {
          otherTable.classList.remove(classNames.booking.tableSelected);
        }

        table.classList.add(classNames.booking.tableSelected);

        const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));
        thisBooking.selectedTable = tableId;
      });
    }
  }

  render(element) {
    const thisBooking = this;

    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = templates.bookingWidget();
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.widgets.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.widgets.booking.hoursAmount);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.widgets.booking.tables);
    thisBooking.dom.tableMessage = thisBooking.dom.wrapper.querySelector('.booking-table-message');
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.widgets.booking.form);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.widgets.booking.address);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.widgets.booking.phone);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.widgets.booking.starters);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePickerWidget = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPickerWidget = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.peopleAmount.addEventListener('click', function () {
      console.log('peopleAmount widget clicked');
    });
    thisBooking.dom.hoursAmount.addEventListener('click', function () {
      console.log('hoursAmount widget clicked');
    });
    thisBooking.dom.datePicker.addEventListener('change', function () {
      thisBooking.getData();
    });
    thisBooking.dom.hourPicker.addEventListener('change', function () {
      thisBooking.updateDOM();
    });
    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  sendBooking() {
    const thisBooking = this;

    const payload = thisBooking.validateBooking();

    if (!payload) {
      return;
    }

    const url = settings.db.url + '/' + settings.db.booking;

    for (let starter of thisBooking.dom.starters) {
      if (starter.checked) {
        payload.starters.push(starter.value);
      }
    }

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
        thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
        thisBooking.selectedTable = null;
        for (let table of thisBooking.dom.tables) {
          table.classList.remove(classNames.booking.tableSelected);
        }
        thisBooking.updateDOM();
      });
  }
}

export default Booking;

import { classNames, templates } from '../settings.js';

class Home {
  constructor(element) {
    this.dom = {};
    this.dom.wrapper = element;

    if (!this.dom.wrapper) {
      return;
    }

    this.render();
    this.initTestimonial();
  }

  render() {
    const thisHome = this;
    const generatedHTML = templates.homeWidget();

    thisHome.dom.wrapper.innerHTML = generatedHTML;
  }

  initTestimonial() {
    const thisHome = this;

    thisHome.dom.track = thisHome.dom.wrapper.querySelector('.home-testimonial__track');
    thisHome.dom.dots = thisHome.dom.wrapper.querySelectorAll('.home-testimonial__dot');
    thisHome.slides = thisHome.dom.track ? thisHome.dom.track.children : [];

    if (!thisHome.dom.track || thisHome.slides.length === 0 || thisHome.dom.dots.length === 0) {
      return;
    }

    thisHome.activeSlideIndex = 0;
    thisHome.bindDotEvents();
    thisHome.goToSlide(0);
  }

  bindDotEvents() {
    const thisHome = this;

    for (let dot of thisHome.dom.dots) {
      dot.addEventListener('click', function () {
        const index = parseInt(this.getAttribute('data-index'), 10);
        if (!isNaN(index)) {
          thisHome.goToSlide(index);
        }
      });
    }
  }

  updateActiveDot() {
    const thisHome = this;

    for (let i = 0; i < thisHome.dom.dots.length; i++) {
      const isActive = i === thisHome.activeSlideIndex;
      thisHome.dom.dots[i].classList.toggle(classNames.nav.active, isActive);
      thisHome.dom.dots[i].setAttribute('aria-current', isActive ? 'true' : 'false');
    }
  }

  goToSlide(nextIndex) {
    const thisHome = this;

    thisHome.activeSlideIndex =
      (nextIndex + thisHome.slides.length) % thisHome.slides.length;
    thisHome.dom.track.style.transform =
      'translateX(' + (-thisHome.activeSlideIndex * 100) + '%)';
    thisHome.updateActiveDot();
  }
}

export default Home;

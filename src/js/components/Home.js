import { classNames, templates } from '../settings.js';

class Home {
  constructor(element) {
    this.dom = {};
    this.dom.wrapper = element;
    this.testimonialAutoplayDelay = 5000;
    this.testimonialAutoplayTimer = null;

    if (!this.dom.wrapper) {
      return;
    }

    this.render();
    this.initActions();
    this.initTestimonial();
  }

  render() {
    const thisHome = this;
    const generatedHTML = templates.homeWidget();

    thisHome.dom.wrapper.innerHTML = generatedHTML;
  }

  initActions() {
    const thisHome = this;
    const ctaTiles = thisHome.dom.wrapper.querySelectorAll('.home-cta__tile');

    for (let tile of ctaTiles) {
      tile.addEventListener('click', function (event) {
        event.preventDefault();

        const href = this.getAttribute('href') || '';
        const targetPageId = href.replace(/^#\/?/, '');

        if (!targetPageId) {
          return;
        }

        const targetHash = '#/' + targetPageId;
        if (window.location.hash === targetHash) {
          window.dispatchEvent(new Event('hashchange'));
          return;
        }

        window.location.hash = targetHash;
      });
    }
  }

  initTestimonial() {
    const thisHome = this;

    thisHome.dom.track = thisHome.dom.wrapper.querySelector('.home-testimonial__track');
    thisHome.dom.dots = thisHome.dom.wrapper.querySelectorAll('.home-testimonial__dot');
    thisHome.dom.testimonial = thisHome.dom.wrapper.querySelector('.home-testimonial');
    thisHome.slides = thisHome.dom.track ? thisHome.dom.track.children : [];

    if (!thisHome.dom.track || thisHome.slides.length === 0 || thisHome.dom.dots.length === 0) {
      return;
    }

    thisHome.activeSlideIndex = 0;
    thisHome.bindDotEvents();
    thisHome.goToSlide(0);
    thisHome.startAutoplay();
    thisHome.bindAutoplayPauseOnHover();
  }

  bindDotEvents() {
    const thisHome = this;

    for (let dot of thisHome.dom.dots) {
      dot.addEventListener('click', function () {
        const index = parseInt(this.getAttribute('data-index'), 10);
        if (!isNaN(index)) {
          thisHome.goToSlide(index);
          thisHome.restartAutoplay();
        }
      });
    }
  }

  bindAutoplayPauseOnHover() {
    const thisHome = this;

    if (!thisHome.dom.testimonial) {
      return;
    }

    thisHome.dom.testimonial.addEventListener('mouseenter', function () {
      thisHome.stopAutoplay();
    });

    thisHome.dom.testimonial.addEventListener('mouseleave', function () {
      thisHome.startAutoplay();
    });
  }

  startAutoplay() {
    const thisHome = this;

    thisHome.stopAutoplay();
    thisHome.testimonialAutoplayTimer = setInterval(function () {
      thisHome.goToSlide(thisHome.activeSlideIndex + 1);
    }, thisHome.testimonialAutoplayDelay);
  }

  stopAutoplay() {
    const thisHome = this;

    if (thisHome.testimonialAutoplayTimer) {
      clearInterval(thisHome.testimonialAutoplayTimer);
      thisHome.testimonialAutoplayTimer = null;
    }
  }

  restartAutoplay() {
    const thisHome = this;

    thisHome.startAutoplay();
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

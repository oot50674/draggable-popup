/**
 * 드래그 가능한 동적 팝업 창 스크립트
 * 작성일 : 2024-11-08
 * 수정일 : 2025-01-01
 * 수정내용 : 이미지 크기 조정 로직 수정
 * 수정일 : 2025-01-14
 * 수정내용 : 제이쿼리 코드 제거
 * 수정일 : 2025-01-15
 * 수정내용 : Font Awesome 자동 import 기능 추가
 * @module draggable-popup
 */

/**
 * 팝업 생성을 위한 설정 객체
 * @typedef {Object} PopupOptions
 * @property {string} title - 팝업창 제목
 * @property {string} content - 팝업창 내용 (HTML 태그 사용 가능)
 * @property {number} width - 팝업창 너비 (픽셀)
 * @property {(number|'auto')} height - 팝업창 높이 ('auto' 또는 픽셀)
 * @property {number|string} top - 팝업창 상단 위치 (픽셀 또는 'center')
 * @property {number|string} left - 팝업창 좌측 위치 (픽셀 또는 'center')
 * @property {boolean} autoSize - 내용에 맞춰 자동 크기 조절 여부
 * @property {boolean} showTodayOption - 오늘 하루 그만보기 옵션 표시 여부
 * @property {string} popupId - 팝업창 고유 ID (쿠키 저장용)
 * @property {string} startDate - 팝업 게시 시작일 (YYYY-MM-DD)
 * @property {string} endDate - 팝업 게시 종료일 (YYYY-MM-DD)
 */

/**
 * 팝업 생성 예시:
 * @example
 * createPopup({
 *   title: '팝업 제목',
 *   content: '팝업 내용',
 *   width: 300,
 *   height: 'auto',
 *   top: 100,
 *   left: 100,
 *   autoSize: false,
 *   showTodayOption: false,
 *   popupId: 'popup1',
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31',
 * });
 */

(function () {
  // Font Awesome 로드 여부 확인 및 로드 함수
  function loadFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
      document.head.appendChild(link);
    }
  }

  // 초기화 시 Font Awesome 로드
  loadFontAwesome();

  // 팝업 기본 템플릿
  var popupTemplate =
    '<div class="draggable-popup-window" style="opacity:0;">' +
      '<div class="popup-header">' +
        '<span></span>' +
        '<span class="close-btn"><i class="fa fa-times"></i></span>' +
      '</div>' +
      '<div class="popup-content"></div>' +
      '<div class="popup-footer" style="display:none;">' +
        '<label>' +
          '<input type="checkbox" class="dont-show-today"> 오늘 하루 그만보기' +
        '</label>' +
      '</div>' +
    '</div>';

  var zIndexCounter = 1000; // z-index 관리를 위한 카운터

  window.createPopup = function (options) {
    var defaults = {
      title: '팝업 제목',
      content: '팝업 내용',
      width: 300,
      height: 'auto',
      top: 'center',
      left: 'center',
      autoSize: false,
      showTodayOption: false,
      popupId: null,
      startDate: null,
      endDate: null
      // links 옵션 제거
    };
    var settings = mergeObjects(defaults, options);

    // 게시 기간 체크
    if (!isWithinDisplayPeriod(settings.startDate, settings.endDate)) {
      return null;
    }

    // 쿠키 체크
    if (settings.popupId && settings.showTodayOption) {
      var cookieName = 'popup_' + settings.popupId;
      if (getPopupCookie(cookieName) === 'hidden') {
        return null;
      }
    }

    var popup = createPopupElement(settings);
    // 초기 위치 값 저장
    popup.dataset.top = settings.top;
    popup.dataset.left = settings.left;
    document.body.appendChild(popup);

    // 드래그 가능하도록 설정
    makePopupDraggable(popup);

    // 오늘 하루 그만보기 옵션 표시
    if (settings.showTodayOption) {
      var footer = popup.querySelector('.popup-footer');
      if (footer) {
        footer.style.display = 'flex';
      }
    }

    // 스타일 설정
    setPopupStyles(popup, settings);

    // 제목 및 내용 설정
    var headerTitle = popup.querySelector('.popup-header span:first-child');
    if (headerTitle) {
      headerTitle.textContent = settings.title;
    }
    var contentElement = popup.querySelector('.popup-content');
    if (contentElement) {
      contentElement.innerHTML = settings.content;
    }

    // 이미지 로드 및 크기 조정
    adjustPopupImages(popup, function () {
      adjustPopupSizeAndPosition(popup);
      showPopup(popup);
    });

    // 닫기 버튼 이벤트 설정
    var closeBtn = popup.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        handleCloseButton(popup, settings);
      });
    }

    // 팝업을 클릭 시 최상위로 가져오기
    popup.addEventListener('mousedown', function () {
      bringToFront(popup);
    });

    // 윈도우 리사이즈 이벤트 처리
    window.addEventListener('resize', function () {
      handleWindowResize(popup);
    });

    return popup;
  };

  // 표시 기간 체크 함수
  function isWithinDisplayPeriod(startDateStr, endDateStr) {
    if (startDateStr && endDateStr) {
      var currentDate = new Date();
      var startDate = new Date(startDateStr);
      var endDate = new Date(endDateStr);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return true;
      }
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      if (currentDate < startDate || currentDate > endDate) {
        return false;
      }
    }
    return true;
  }

  // 단순 객체 병합 함수 (Object.assign 대체)
  function mergeObjects(target, source) {
    var merged = {};
    var prop;
    for (prop in target) {
      if (target.hasOwnProperty(prop)) {
        merged[prop] = target[prop];
      }
    }
    for (prop in source) {
      if (source.hasOwnProperty(prop)) {
        merged[prop] = source[prop];
      }
    }
    return merged;
  }

  // 팝업 요소 생성 함수
  function createPopupElement(settings) {
    var templateWrapper = document.createElement('div');
    templateWrapper.innerHTML = popupTemplate;
    var popup = templateWrapper.firstElementChild;

    if (settings.autoSize) {
      popup.classList.add('auto-size');
    } else {
      popup.classList.add('fixed-size');
    }
    return popup;
  }

  // 팝업 스타일 설정 함수
  function setPopupStyles(popup, settings) {
    var footer = popup.querySelector('.popup-footer');
    var footerHeight = 0;
    if (settings.showTodayOption && footer) {
      footerHeight = footer.offsetHeight;
    }
    popup.style.position = 'fixed';
    popup.style.display = 'flex';
    popup.style.visibility = 'hidden';
    popup.style.width = settings.autoSize ? 'auto' : (settings.width + 'px');
    if (settings.autoSize || settings.height === 'auto') {
      popup.style.height = 'auto';
    } else {
      popup.style.height = (settings.height + footerHeight) + 'px';
    }
    zIndexCounter++;
    popup.style.zIndex = zIndexCounter;
  }

  // 개별 이미지 크기 조정 함수
  function adjustImageSize(img) {
    var windowWidth = window.innerWidth - 40;
    var windowHeight = window.innerHeight - 40;
    var imgWidth = img.naturalWidth;
    var imgHeight = img.naturalHeight;
    var content = closestByClassName(img, 'popup-content');
    if (content) {
      var contentWidth = content.clientWidth;
      // 컨텐츠 영역보다 이미지가 클 경우 축소
      if (imgWidth > contentWidth) {
        img.style.maxWidth = '100%';
        img.style.width = contentWidth + 'px';
        img.style.height = 'auto';
        return;
      }
    }
    // 윈도우보다 이미지가 큰 경우 축소
    if (imgWidth > windowWidth || imgHeight > windowHeight) {
      var widthRatio = windowWidth / imgWidth;
      var heightRatio = windowHeight / imgHeight;
      var ratio = widthRatio < heightRatio ? widthRatio : heightRatio;
      img.style.maxWidth = (imgWidth * ratio) + 'px';
      img.style.maxHeight = (imgHeight * ratio) + 'px';
      img.style.width = 'auto';
      img.style.height = 'auto';
    }
  }

  // 이미지 로드 후 팝업 크기 조정 함수
  function adjustPopupImages(popup, callback) {
    var images = popup.querySelectorAll('img');
    if (images.length > 0) {
      var imagesLoaded = 0;
      var totalImages = images.length;

      function checkAllImagesLoaded() {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
          callback();
        }
      }

      for (var i = 0; i < images.length; i++) {
        (function (img) {
          if (img.complete) {
            adjustImageSize(img);
            checkAllImagesLoaded();
          } else {
            img.addEventListener('load', function () {
              adjustImageSize(img);
              checkAllImagesLoaded();
            });
            img.addEventListener('error', function () {
              checkAllImagesLoaded();
            });
          }
        })(images[i]);
      }
    } else {
      callback();
    }
  }

  // 팝업 표시 함수
  function showPopup(popup) {
    popup.style.display = 'flex';
    popup.style.visibility = 'visible';
    popup.style.opacity = '1';
  }

  // 팝업 크기 및 위치 조정 함수
  function adjustPopupSizeAndPosition(popup) {
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var popupWidth = popup.offsetWidth;
    var popupHeight = popup.offsetHeight;

    var sizeAdjusted = false;

    // 팝업이 화면보다 큰 경우 크기 제한
    if (popupWidth > windowWidth - 20) {
      popup.style.width = (windowWidth - 20) + 'px';
      sizeAdjusted = true;
    }
    if (popupHeight > windowHeight - 20) {
      popup.style.height = (windowHeight - 20) + 'px';
      sizeAdjusted = true;
    }

    // 설정된 위치 확인
    var left = popup.dataset.left !== undefined ? popup.dataset.left : 'center';
    var top = popup.dataset.top !== undefined ? popup.dataset.top : 'center';

    function toNumberOrCenter(val) {
      if (val === 'center') return 'center';
      return parseInt(val, 10);
    }
    left = toNumberOrCenter(left);
    top = toNumberOrCenter(top);

    var newPopupWidth = popup.offsetWidth;
    var newPopupHeight = popup.offsetHeight;

    // 가로 위치 계산
    if (left === 'center') {
      left = (windowWidth - newPopupWidth) / 2;
    }
    // 세로 위치 계산
    if (top === 'center') {
      top = (windowHeight - newPopupHeight) / 2;
    }

    var positionAdjusted = false;
    // 오른쪽 또는 왼쪽 화면 밖으로 나가는 경우 재조정
    if (left + newPopupWidth > windowWidth || left < 0) {
      left = (windowWidth - newPopupWidth) / 2;
      positionAdjusted = true;
    }
    // 아래 또는 위 화면 밖으로 나가는 경우 재조정
    if (top + newPopupHeight > windowHeight || top < 0) {
      if (newPopupHeight < windowHeight) {
        top = (windowHeight - newPopupHeight) / 2;
      } else {
        top = 0;
      }
      positionAdjusted = true;
    }

    // 크기 및 위치가 전혀 조정되지 않았다면, 데이터셋에 설정한 위치값 사용
    if (!sizeAdjusted && !positionAdjusted) {
      left = (popup.dataset.left === 'center')
        ? (windowWidth - newPopupWidth) / 2
        : parseInt(popup.dataset.left, 10);
      top = (popup.dataset.top === 'center')
        ? (windowHeight - newPopupHeight) / 2
        : parseInt(popup.dataset.top, 10);
    }

    popup.style.left = left + 'px';
    popup.style.top = top + 'px';
  }

  // 닫기 버튼 처리 함수
  function handleCloseButton(popup, settings) {
    var dontShowToday = popup.querySelector('.dont-show-today');
    // 쿠키 설정
    if (dontShowToday && dontShowToday.checked && settings.popupId) {
      var cookieName = 'popup_' + settings.popupId;
      setPopupCookie(cookieName, 'hidden', 1);
    }
    // 팝업 제거
    if (popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }
  }

  // 팝업을 최상위로 가져오는 함수
  function bringToFront(popup) {
    var baseIndex = 1000;
    var popups = document.querySelectorAll('.draggable-popup-window');
    for (var i = 0; i < popups.length; i++) {
      popups[i].style.zIndex = baseIndex + i;
    }
    popup.style.zIndex = baseIndex + popups.length;
    zIndexCounter = baseIndex + popups.length;
  }

  // 윈도우 리사이즈 처리 함수
  function handleWindowResize(popup) {
    adjustPopupSizeAndPosition(popup);
    var images = popup.querySelectorAll('img');
    for (var i = 0; i < images.length; i++) {
      adjustImageSize(images[i]);
    }
  }

  // 쿠키 설정 함수
  function setPopupCookie(name, value, expireDays) {
    var date = new Date();
    date.setDate(date.getDate() + expireDays);
    document.cookie =
      name + '=' + value + ';expires=' + date.toUTCString() + ';path=/';
  }

  // 쿠키 가져오기 함수
  function getPopupCookie(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  // 특정 클래스명을 가진 상위 요소 찾기
  function closestByClassName(element, className) {
    var current = element;
    while (current) {
      if (current.classList && current.classList.contains(className)) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  // 드래그 기능 구현 함수
  function makePopupDraggable(popup) {
    var header = popup.querySelector('.popup-header');
    if (!header) return;

    var isDragging = false;
    var startX = 0;
    var startY = 0;
    var originalLeft = 0;
    var originalTop = 0;

    // 드래그 시작 (mousedown)
    header.addEventListener('mousedown', function (e) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      var rect = popup.getBoundingClientRect();
      originalLeft = rect.left;
      originalTop = rect.top;
      document.body.style.userSelect = 'none';
    });

    // 드래그 중 (mousemove)
    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      var deltaX = e.clientX - startX;
      var deltaY = e.clientY - startY;
      var newLeft = originalLeft + deltaX;
      var newTop = originalTop + deltaY;
      var windowWidth = window.innerWidth;
      var windowHeight = window.innerHeight;
      var popupWidth = popup.offsetWidth;
      var popupHeight = popup.offsetHeight;

      // 팝업이 화면 밖으로 나가지 않도록 제한
      newLeft = Math.max(0, Math.min(newLeft, windowWidth - popupWidth));
      newTop = Math.max(0, Math.min(newTop, windowHeight - popupHeight));

      popup.style.left = newLeft + 'px';
      popup.style.top = newTop + 'px';
    });

    // 드래그 종료 (mouseup)
    document.addEventListener('mouseup', function () {
      isDragging = false;
      document.body.style.userSelect = '';
    });
  }
})();

# Draggable Popup

## 소개

팝업을 드래그하여 이동시킬 수 있는 기능을 제공하는 자바스크립트 라이브러리입니다. 팝업의 크기를 자동으로 조절하고, '오늘 하루 그만보기' 옵션을 제공하여 사용자 경험을 향상시킵니다.

## 사용법

1. `draggable-popup.js`와 `draggable-popup.css` 파일을 프로젝트에 포함시킵니다.
2. HTML 파일에 팝업을 생성하는 함수를 추가합니다. 예를 들어:

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <title>Draggable Popup Test</title>
    <link rel="stylesheet" href="./draggable-popup.css" />
  </head>
  <body>
    <div class="container">
      <h1>Draggable Popup 테스트</h1>
      <button onclick="createTestPopup()">팝업 생성</button>
    </div>

    <script src="draggable-popup.js"></script>
    <script>
      function createTestPopup() {
        createPopup({
          title: "이미지 팝업 예제", // 팝업 제목
          content:
            '<img src="https://picsum.photos/600/400" alt="샘플 이미지">',
          // content에 img 태그 사용하여 이미지 포함
          autoSize: true,
          top: "100", // 세로 중앙 배치
          left: "200", // 가로 중앙 배치
          showTodayOption: true, // '오늘 하루 그만보기' 옵션 표시
          popupId: "imagePopup2", // 팝업 고유 ID
          startDate: "2024-01-01", // 팝업 게시 시작일
          endDate: "2099-12-31", // 팝업 게시 종료일
        });
      }
    </script>
  </body>
</html>
```

3. `createPopup` 함수를 호출하여 팝업을 생성합니다. 이 함수는 팝업의 제목, 내용, 크기, 위치, '오늘 하루 그만보기' 옵션, 팝업 ID, 게시 시작일 및 종료일 등을 인자로 받습니다.

## 주요 기능

- 팝업 드래그 기능
- 자동 크기 조절
- '오늘 하루 그만보기' 옵션
- 팝업 게시 기간 설정

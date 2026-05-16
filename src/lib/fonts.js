// Pretendard 폰트 9개 weight @font-face 선언
// projectnoonnu CDN의 woff2 파일을 직접 로드한다.
// HTML 저장 시 인터랙티브 결과물에 폰트가 임베드되도록 메인 컴포넌트에서 <style>에 주입한다.

export const PRETENDARD_FONT_FACE_CSS = `
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Thin.woff2') format('woff2'); font-weight: 100; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-ExtraLight.woff2') format('woff2'); font-weight: 200; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Light.woff2') format('woff2'); font-weight: 300; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Medium.woff2') format('woff2'); font-weight: 500; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-SemiBold.woff2') format('woff2'); font-weight: 600; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Bold.woff2') format('woff2'); font-weight: 700; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-ExtraBold.woff2') format('woff2'); font-weight: 800; font-display: swap; }
@font-face { font-family: 'Pretendard'; src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/pretendard@1.0/Pretendard-Black.woff2') format('woff2'); font-weight: 900; font-display: swap; }
`;

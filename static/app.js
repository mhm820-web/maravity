/**
 * 단어장 인쇄 프로그램 - JavaScript
 * 인쇄 전용 기능만 포함
 */

// 레벨 데이터 저장
let levelsData = [];
let allWordsData = {};

// DOM 요소
const elements = {
    printLevel: document.getElementById('print-level'),
    wordCount: document.getElementById('word-count'),
    printType: document.getElementById('print-type'),
    generateBtn: document.getElementById('generate-btn'),
    doPrintBtn: document.getElementById('do-print-btn'),
    backBtn: document.getElementById('back-btn'),
    printContent: document.getElementById('print-content'),
    wordInfo: document.getElementById('word-info'),
    mainView: document.getElementById('main-view'),
    printView: document.getElementById('print-view')
};

// 화면 전환
function showScreen(screenName) {
    elements.mainView.classList.remove('active');
    elements.printView.classList.remove('active');

    if (screenName === 'main') {
        elements.mainView.classList.add('active');
    } else if (screenName === 'print') {
        elements.printView.classList.add('active');
    }
}

// 레벨 목록 로드
async function loadLevels() {
    try {
        const response = await fetch('/api/levels');
        const data = await response.json();

        if (data.success) {
            levelsData = data.levels;

            // 레벨 선택 옵션 생성
            elements.printLevel.innerHTML = levelsData.map(level =>
                `<option value="${level.id}">${level.name} (${level.count}개)</option>`
            ).join('');
        }
    } catch (error) {
        console.error('레벨 로드 실패:', error);
    }
}

// 단어장 생성
async function generateWordList() {
    const levelId = elements.printLevel.value;
    const wordCount = parseInt(elements.wordCount.value);
    const printType = elements.printType.value;

    const levelInfo = levelsData.find(l => l.id === levelId);
    const levelName = levelInfo ? levelInfo.name : levelId;

    try {
        // 단어 로드 (최대 2000개까지 지원)
        const response = await fetch(`/api/words/${levelId}?count=${wordCount}`);
        const data = await response.json();

        if (!data.success) {
            elements.printContent.innerHTML = '<p>단어 로드 실패</p>';
            return;
        }

        const words = data.words;

        // 정보 표시
        elements.wordInfo.textContent = `${levelName} - ${words.length}개 단어`;

        // 제목 생성
        let typeLabel = '';
        if (printType === 'full') {
            typeLabel = '단어장';
        } else if (printType === 'word-only') {
            typeLabel = '시험지 (단어 → 뜻)';
        } else {
            typeLabel = '시험지 (뜻 → 단어)';
        }

        let html = `
            <h1 class="print-title">${levelName} ${typeLabel}</h1>
            <p class="print-subtitle">총 ${words.length}개 단어</p>
        `;

        // 테이블 생성
        html += '<table class="word-table">';

        if (printType === 'full') {
            // 단어 + 뜻 모두 표시
            html += `
                <thead>
                    <tr>
                        <th class="no-col">No.</th>
                        <th class="word-col">단어</th>
                        <th class="meaning-col">뜻</th>
                    </tr>
                </thead>
                <tbody>
            `;
            words.forEach((word, index) => {
                html += `
                    <tr>
                        <td class="no-col">${index + 1}</td>
                        <td class="word-col">${word.word}</td>
                        <td class="meaning-col">${word.meaning}</td>
                    </tr>
                `;
            });
        } else if (printType === 'word-only') {
            // 단어만 표시 (뜻은 빈칸)
            html += `
                <thead>
                    <tr>
                        <th class="no-col">No.</th>
                        <th class="word-col">단어</th>
                        <th class="meaning-col">뜻</th>
                    </tr>
                </thead>
                <tbody>
            `;
            words.forEach((word, index) => {
                html += `
                    <tr>
                        <td class="no-col">${index + 1}</td>
                        <td class="word-col">${word.word}</td>
                        <td class="meaning-col blank-col"></td>
                    </tr>
                `;
            });
        } else {
            // 뜻만 표시 (단어는 빈칸)
            html += `
                <thead>
                    <tr>
                        <th class="no-col">No.</th>
                        <th class="word-col">단어</th>
                        <th class="meaning-col">뜻</th>
                    </tr>
                </thead>
                <tbody>
            `;
            words.forEach((word, index) => {
                html += `
                    <tr>
                        <td class="no-col">${index + 1}</td>
                        <td class="word-col blank-col"></td>
                        <td class="meaning-col">${word.meaning}</td>
                    </tr>
                `;
            });
        }

        html += '</tbody></table>';

        elements.printContent.innerHTML = html;
        showScreen('print');

    } catch (error) {
        elements.printContent.innerHTML = '<p>오류 발생: ' + error.message + '</p>';
    }
}

// 인쇄 실행
function doPrint() {
    window.print();
}

// 메인 화면으로 돌아가기
function goBack() {
    showScreen('main');
}

// 이벤트 리스너
elements.generateBtn.addEventListener('click', generateWordList);
elements.doPrintBtn.addEventListener('click', doPrint);
elements.backBtn.addEventListener('click', goBack);

// 초기화
loadLevels();

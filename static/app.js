/**
 * 단어장 인쇄 프로그램 - JavaScript
 * 이중 범위 선택 (단어/뜻) + 히스토리 + 답안지 기능
 */

// 레벨 데이터 저장
let levelsData = [];
let lastGeneratedData = null; // 마지막 생성 데이터 저장

// DOM 요소
const elements = {
    printLevel: document.getElementById('print-level'),
    wordStart: document.getElementById('word-start'),
    wordEnd: document.getElementById('word-end'),
    meaningStart: document.getElementById('meaning-start'),
    meaningEnd: document.getElementById('meaning-end'),
    printType: document.getElementById('print-type'),
    generateBtn: document.getElementById('generate-btn'),
    generateAnswerBtn: document.getElementById('generate-answer-btn'),
    doPrintBtn: document.getElementById('do-print-btn'),
    backBtn: document.getElementById('back-btn'),
    printContent: document.getElementById('print-content'),
    wordInfo: document.getElementById('word-info'),
    mainView: document.getElementById('main-view'),
    printView: document.getElementById('print-view'),
    historyList: document.getElementById('history-list'),
    clearHistoryBtn: document.getElementById('clear-history-btn')
};

// 히스토리 키
const HISTORY_KEY = 'wordlist_history';

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

            elements.printLevel.innerHTML = levelsData.map(level =>
                `<option value="${level.id}">${level.name} (${level.count}개)</option>`
            ).join('');

            updateRangeMax();
        }
    } catch (error) {
        console.error('레벨 로드 실패:', error);
    }
}

// 레벨 변경 시 범위 최대값 업데이트
function updateRangeMax() {
    // 레벨 데이터의 개수와 상관없이 최대 2000번까지 입력 가능하게 설정
    const maxVal = 2000;
    elements.wordEnd.max = maxVal;
    elements.wordStart.max = maxVal;
    elements.meaningEnd.max = maxVal;
    elements.meaningStart.max = maxVal;
}

// 시험지 생성 (단어만 또는 뜻만)
async function generateWordList() {
    const levelId = elements.printLevel.value;
    const wordStart = parseInt(elements.wordStart.value) || 1;
    const wordEnd = parseInt(elements.wordEnd.value) || 500;
    const meaningStart = parseInt(elements.meaningStart.value) || 501;
    const meaningEnd = parseInt(elements.meaningEnd.value) || 1000;
    const printType = elements.printType.value;

    if (wordStart < 1 || wordEnd < wordStart || meaningStart < 1 || meaningEnd < meaningStart) {
        alert('올바른 범위를 입력하세요.');
        return;
    }

    const levelInfo = levelsData.find(l => l.id === levelId);
    const levelName = levelInfo ? levelInfo.name : levelId;

    try {
        // 단어와 뜻을 각각 다른 범위로 가져오기
        const wordResponse = await fetch(`/api/words/${levelId}?start=${wordStart}&end=${wordEnd}`);
        const wordData = await wordResponse.json();

        const meaningResponse = await fetch(`/api/words/${levelId}?start=${meaningStart}&end=${meaningEnd}`);
        const meaningData = await meaningResponse.json();

        if (!wordData.success || !meaningData.success) {
            alert('단어 로드 실패');
            return;
        }

        const words = wordData.words;
        const meanings = meaningData.words;

        // 마지막 생성 데이터 저장 (답안지용)
        lastGeneratedData = {
            levelId, levelName, wordStart, wordEnd, meaningStart, meaningEnd, printType,
            words, meanings
        };

        // HTML 생성
        let html = generateTableHTML(levelName, wordStart, wordEnd, meaningStart, meaningEnd, printType, words, meanings, false);

        elements.wordInfo.textContent = `${levelName} - 시험지`;
        elements.printContent.innerHTML = html;

        showScreen('print');

    } catch (error) {
        alert('오류 발생: ' + error.message);
    }
}

// 답안지 생성
async function generateAnswerSheet() {
    const levelId = elements.printLevel.value;
    const wordStart = parseInt(elements.wordStart.value) || 1;
    const wordEnd = parseInt(elements.wordEnd.value) || 500;
    const meaningStart = parseInt(elements.meaningStart.value) || 501;
    const meaningEnd = parseInt(elements.meaningEnd.value) || 1000;
    const printType = elements.printType.value;

    const levelInfo = levelsData.find(l => l.id === levelId);
    const levelName = levelInfo ? levelInfo.name : levelId;

    try {
        const wordResponse = await fetch(`/api/words/${levelId}?start=${wordStart}&end=${wordEnd}`);
        const wordData = await wordResponse.json();

        const meaningResponse = await fetch(`/api/words/${levelId}?start=${meaningStart}&end=${meaningEnd}`);
        const meaningData = await meaningResponse.json();

        if (!wordData.success || !meaningData.success) {
            alert('단어 로드 실패');
            return;
        }

        const words = wordData.words;
        const meanings = meaningData.words;

        // 답안지 HTML 생성 (isAnswer = true)
        let html = generateTableHTML(levelName, wordStart, wordEnd, meaningStart, meaningEnd, printType, words, meanings, true);

        elements.wordInfo.textContent = `${levelName} - 답안지`;
        elements.printContent.innerHTML = html;

        showScreen('print');

    } catch (error) {
        alert('오류 발생: ' + error.message);
    }
}

// 테이블 HTML 생성
function generateTableHTML(levelName, wordStart, wordEnd, meaningStart, meaningEnd, printType, words, meanings, isAnswer) {
    const docType = isAnswer ? '답안지' : '시험지';
    let typeLabel = getTypeLabel(printType);

    let html = `
        <h1 class="print-title">${levelName} ${isAnswer ? '답안지' : typeLabel}</h1>
        <p class="print-subtitle">단어: ${wordStart}~${wordEnd}번 / 뜻: ${meaningStart}~${meaningEnd}번</p>
    `;

    html += '<table class="word-table">';
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

    const maxLen = Math.max(words.length, meanings.length);

    for (let i = 0; i < maxLen; i++) {
        const word = words[i] ? words[i].word : '-';
        const meaning = meanings[i] ? meanings[i].meaning : '-';

        if (isAnswer) {
            // 답안지: 모두 표시
            html += `
                <tr>
                    <td class="no-col">${i + 1}</td>
                    <td class="word-col">${word}</td>
                    <td class="meaning-col">${meaning}</td>
                </tr>
            `;
        } else if (printType === 'full') {
            html += `
                <tr>
                    <td class="no-col">${i + 1}</td>
                    <td class="word-col">${word}</td>
                    <td class="meaning-col">${meaning}</td>
                </tr>
            `;
        } else if (printType === 'word-only') {
            html += `
                <tr>
                    <td class="no-col">${i + 1}</td>
                    <td class="word-col">${word}</td>
                    <td class="meaning-col blank-col"></td>
                </tr>
            `;
        } else {
            html += `
                <tr>
                    <td class="no-col">${i + 1}</td>
                    <td class="word-col blank-col"></td>
                    <td class="meaning-col">${meaning}</td>
                </tr>
            `;
        }
    }

    html += '</tbody></table>';
    return html;
}

// 유형 라벨 반환
function getTypeLabel(printType) {
    if (printType === 'full') return '단어장';
    if (printType === 'word-only') return '시험지 (단어 → 뜻)';
    return '시험지 (뜻 → 단어)';
}

// 인쇄 실행
function doPrint() {
    window.print();
}

// 메인 화면으로
function goBack() {
    showScreen('main');
}

// 빠른 설정 버튼
function setupPresetButtons() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.wordStart.value = btn.dataset.ws;
            elements.wordEnd.value = btn.dataset.we;
            elements.meaningStart.value = btn.dataset.ms;
            elements.meaningEnd.value = btn.dataset.me;
        });
    });
}

// 이벤트 리스너
elements.generateBtn.addEventListener('click', generateWordList);
elements.generateAnswerBtn.addEventListener('click', generateAnswerSheet);
elements.doPrintBtn.addEventListener('click', doPrint);
elements.backBtn.addEventListener('click', goBack);
elements.printLevel.addEventListener('change', updateRangeMax);

// 초기화
loadLevels();
setupPresetButtons();

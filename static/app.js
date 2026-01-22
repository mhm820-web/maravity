/**
 * 단어장 인쇄 프로그램 - JavaScript
 * 이중 범위 선택 (단어/뜻) + 히스토리 기능
 */

// 레벨 데이터 저장
let levelsData = [];

// DOM 요소
const elements = {
    printLevel: document.getElementById('print-level'),
    wordStart: document.getElementById('word-start'),
    wordEnd: document.getElementById('word-end'),
    meaningStart: document.getElementById('meaning-start'),
    meaningEnd: document.getElementById('meaning-end'),
    printType: document.getElementById('print-type'),
    generateBtn: document.getElementById('generate-btn'),
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
    const levelId = elements.printLevel.value;
    const levelInfo = levelsData.find(l => l.id === levelId);

    if (levelInfo) {
        const maxVal = levelInfo.count;
        elements.wordEnd.max = maxVal;
        elements.wordStart.max = maxVal;
        elements.meaningEnd.max = maxVal;
        elements.meaningStart.max = maxVal;
    }
}

// 단어장 생성
async function generateWordList() {
    const levelId = elements.printLevel.value;
    const wordStart = parseInt(elements.wordStart.value) || 1;
    const wordEnd = parseInt(elements.wordEnd.value) || 500;
    const meaningStart = parseInt(elements.meaningStart.value) || 1;
    const meaningEnd = parseInt(elements.meaningEnd.value) || 500;
    const printType = elements.printType.value;

    // 범위 검증
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

        // 정보 표시
        let infoText = `${levelName}`;
        if (printType === 'full') {
            infoText += ` - 단어: ${wordStart}~${wordEnd}번, 뜻: ${meaningStart}~${meaningEnd}번`;
        } else if (printType === 'word-only') {
            infoText += ` - 단어: ${wordStart}~${wordEnd}번 (${words.length}개)`;
        } else {
            infoText += ` - 뜻: ${meaningStart}~${meaningEnd}번 (${meanings.length}개)`;
        }
        elements.wordInfo.textContent = infoText;

        // 제목 생성
        let typeLabel = '';
        if (printType === 'full') {
            typeLabel = '단어장';
        } else if (printType === 'word-only') {
            typeLabel = '시험지 (단어 → 뜻)';
        } else {
            typeLabel = '시험지 (뜻 → 단어)';
        }

        let html = `<h1 class="print-title">${levelName} ${typeLabel}</h1>`;

        if (printType === 'full') {
            html += `<p class="print-subtitle">단어: ${wordStart}~${wordEnd}번 / 뜻: ${meaningStart}~${meaningEnd}번</p>`;
        } else if (printType === 'word-only') {
            html += `<p class="print-subtitle">${wordStart}번 ~ ${wordEnd}번 (총 ${words.length}개)</p>`;
        } else {
            html += `<p class="print-subtitle">${meaningStart}번 ~ ${meaningEnd}번 (총 ${meanings.length}개)</p>`;
        }

        // 테이블 생성
        html += '<table class="word-table">';

        if (printType === 'full') {
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
            // 두 배열 중 더 긴 것 기준으로 순회
            const maxLen = Math.max(words.length, meanings.length);
            for (let i = 0; i < maxLen; i++) {
                const word = words[i] ? words[i].word : '-';
                const meaning = meanings[i] ? meanings[i].meaning : '-';
                html += `
                    <tr>
                        <td class="no-col">${i + 1}</td>
                        <td class="word-col">${word}</td>
                        <td class="meaning-col">${meaning}</td>
                    </tr>
                `;
            }
        } else if (printType === 'word-only') {
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
                        <td class="no-col">${wordStart + index}</td>
                        <td class="word-col">${word.word}</td>
                        <td class="meaning-col blank-col"></td>
                    </tr>
                `;
            });
        } else {
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
            meanings.forEach((word, index) => {
                html += `
                    <tr>
                        <td class="no-col">${meaningStart + index}</td>
                        <td class="word-col blank-col"></td>
                        <td class="meaning-col">${word.meaning}</td>
                    </tr>
                `;
            });
        }

        html += '</tbody></table>';

        elements.printContent.innerHTML = html;

        // 히스토리 저장
        saveToHistory({
            levelId,
            levelName,
            wordStart,
            wordEnd,
            meaningStart,
            meaningEnd,
            printType,
            typeLabel,
            timestamp: new Date().toISOString()
        });

        showScreen('print');

    } catch (error) {
        alert('오류 발생: ' + error.message);
    }
}

// 히스토리 저장
function saveToHistory(item) {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

    // 최신 항목을 맨 앞에 추가
    history.unshift(item);

    // 최대 20개까지만 저장
    if (history.length > 20) {
        history = history.slice(0, 20);
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    renderHistory();
}

// 히스토리 불러오기
function loadHistory() {
    renderHistory();
}

// 히스토리 렌더링
function renderHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

    if (history.length === 0) {
        elements.historyList.innerHTML = '<p class="no-history">아직 히스토리가 없습니다.</p>';
        return;
    }

    elements.historyList.innerHTML = history.map((item, index) => {
        const date = new Date(item.timestamp);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

        return `
            <div class="history-item" data-index="${index}">
                <div class="history-info">
                    <span class="history-level">${item.levelName}</span>
                    <span class="history-range">단어: ${item.wordStart}~${item.wordEnd} / 뜻: ${item.meaningStart}~${item.meaningEnd}</span>
                    <span class="history-type">${item.typeLabel}</span>
                </div>
                <div class="history-meta">
                    <span class="history-date">${dateStr}</span>
                    <button class="history-load-btn" data-index="${index}">불러오기</button>
                </div>
            </div>
        `;
    }).join('');

    // 불러오기 버튼 이벤트
    document.querySelectorAll('.history-load-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            loadFromHistory(index);
        });
    });
}

// 히스토리에서 불러오기
function loadFromHistory(index) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const item = history[index];

    if (!item) return;

    elements.printLevel.value = item.levelId;
    elements.wordStart.value = item.wordStart;
    elements.wordEnd.value = item.wordEnd;
    elements.meaningStart.value = item.meaningStart;
    elements.meaningEnd.value = item.meaningEnd;
    elements.printType.value = item.printType;
}

// 히스토리 삭제
function clearHistory() {
    if (confirm('모든 히스토리를 삭제하시겠습니까?')) {
        localStorage.removeItem(HISTORY_KEY);
        renderHistory();
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

// 빠른 범위 선택 버튼
function setupQuickRangeButtons() {
    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const start = btn.dataset.start;
            const end = btn.dataset.end;
            // 단어와 뜻 범위 모두 동일하게 설정
            elements.wordStart.value = start;
            elements.wordEnd.value = end;
            elements.meaningStart.value = start;
            elements.meaningEnd.value = end;
        });
    });
}

// 이벤트 리스너
elements.generateBtn.addEventListener('click', generateWordList);
elements.doPrintBtn.addEventListener('click', doPrint);
elements.backBtn.addEventListener('click', goBack);
elements.printLevel.addEventListener('change', updateRangeMax);
elements.clearHistoryBtn.addEventListener('click', clearHistory);

// 초기화
loadLevels();
setupQuickRangeButtons();
loadHistory();

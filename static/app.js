/**
 * 단어장 인쇄 프로그램 - JavaScript
 * 인쇄 전용 기능 (범위 선택 지원)
 */

// 레벨 데이터 저장
let levelsData = [];

// DOM 요소
const elements = {
    printLevel: document.getElementById('print-level'),
    startNum: document.getElementById('start-num'),
    endNum: document.getElementById('end-num'),
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

            // 첫 번째 레벨의 단어 수에 맞게 범위 설정
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
        elements.endNum.max = levelInfo.count;
        elements.startNum.max = levelInfo.count;

        // endNum이 최대값을 넘으면 조정
        if (parseInt(elements.endNum.value) > levelInfo.count) {
            elements.endNum.value = levelInfo.count;
        }
    }
}

// 단어장 생성
async function generateWordList() {
    const levelId = elements.printLevel.value;
    const startNum = parseInt(elements.startNum.value) || 1;
    const endNum = parseInt(elements.endNum.value) || 500;
    const printType = elements.printType.value;

    // 범위 검증
    if (startNum < 1 || endNum < startNum) {
        alert('올바른 범위를 입력하세요.');
        return;
    }

    const levelInfo = levelsData.find(l => l.id === levelId);
    const levelName = levelInfo ? levelInfo.name : levelId;

    try {
        // 단어 로드 (범위 지정)
        const response = await fetch(`/api/words/${levelId}?start=${startNum}&end=${endNum}`);
        const data = await response.json();

        if (!data.success) {
            alert('단어 로드 실패: ' + data.error);
            return;
        }

        const words = data.words;

        // 정보 표시
        elements.wordInfo.textContent = `${levelName} - ${startNum}~${endNum}번 (${words.length}개)`;

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
            <p class="print-subtitle">${startNum}번 ~ ${endNum}번 (총 ${words.length}개)</p>
        `;

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
            words.forEach((word, index) => {
                html += `
                    <tr>
                        <td class="no-col">${startNum + index}</td>
                        <td class="word-col">${word.word}</td>
                        <td class="meaning-col">${word.meaning}</td>
                    </tr>
                `;
            });
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
                        <td class="no-col">${startNum + index}</td>
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
            words.forEach((word, index) => {
                html += `
                    <tr>
                        <td class="no-col">${startNum + index}</td>
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
        alert('오류 발생: ' + error.message);
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
            elements.startNum.value = start;
            elements.endNum.value = end;
        });
    });
}

// 이벤트 리스너
elements.generateBtn.addEventListener('click', generateWordList);
elements.doPrintBtn.addEventListener('click', doPrint);
elements.backBtn.addEventListener('click', goBack);
elements.printLevel.addEventListener('change', updateRangeMax);

// 초기화
loadLevels();
setupQuickRangeButtons();

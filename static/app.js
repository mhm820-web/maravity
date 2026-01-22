/**
 * 단어 시험 프로그램 - JavaScript
 */

// 상태 관리
const state = {
    currentLevel: null,
    words: [],
    currentIndex: 0,
    score: 0,
    wrongAnswers: [],
    answered: false
};

// DOM 요소
const screens = {
    levelSelect: document.getElementById('level-select'),
    quiz: document.getElementById('quiz'),
    result: document.getElementById('result'),
    printView: document.getElementById('print-view')
};

const elements = {
    levelGrid: document.getElementById('level-grid'),
    wordCount: document.getElementById('word-count'),
    progress: document.getElementById('progress'),
    scoreDisplay: document.getElementById('score-display'),
    currentWord: document.getElementById('current-word'),
    answerInput: document.getElementById('answer-input'),
    submitBtn: document.getElementById('submit-btn'),
    feedback: document.getElementById('feedback'),
    nextBtn: document.getElementById('next-btn'),
    finalScore: document.getElementById('final-score'),
    scoreTotal: document.querySelector('.score-total'),
    scoreMessage: document.getElementById('score-message'),
    wrongAnswers: document.getElementById('wrong-answers'),
    wrongList: document.getElementById('wrong-list'),
    retryBtn: document.getElementById('retry-btn'),
    // 인쇄 관련 요소
    printBtn: document.getElementById('print-btn'),
    printLevel: document.getElementById('print-level'),
    printType: document.getElementById('print-type'),
    doPrintBtn: document.getElementById('do-print-btn'),
    backBtn: document.getElementById('back-btn'),
    printContent: document.getElementById('print-content')
};

// 화면 전환
function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// 레벨 목록 로드
async function loadLevels() {
    try {
        const response = await fetch('/api/levels');
        const data = await response.json();

        if (data.success) {
            renderLevels(data.levels);
        } else {
            alert('레벨 로드 실패: ' + data.error);
        }
    } catch (error) {
        alert('서버 연결 실패: ' + error.message);
    }
}

// 레벨 버튼 렌더링
function renderLevels(levels) {
    elements.levelGrid.innerHTML = levels.map(level => `
        <button class="level-btn" data-level="${level.id}">
            <span class="level-name">${level.name}</span>
            <span class="level-count">${level.count}개 단어</span>
        </button>
    `).join('');

    // 이벤트 리스너 추가
    elements.levelGrid.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', () => startQuiz(btn.dataset.level));
    });
}

// 퀴즈 시작
async function startQuiz(levelId) {
    state.currentLevel = levelId;
    state.currentIndex = 0;
    state.score = 0;
    state.wrongAnswers = [];
    state.answered = false;

    const wordCount = parseInt(elements.wordCount.value);

    try {
        const response = await fetch(`/api/words/${levelId}?count=${wordCount}`);
        const data = await response.json();

        if (data.success) {
            state.words = data.words;
            showScreen('quiz');
            showQuestion();
        } else {
            alert('단어 로드 실패: ' + data.error);
        }
    } catch (error) {
        alert('서버 연결 실패: ' + error.message);
    }
}

// 문제 표시
function showQuestion() {
    const word = state.words[state.currentIndex];

    elements.progress.textContent = `${state.currentIndex + 1} / ${state.words.length}`;
    elements.scoreDisplay.textContent = `정답: ${state.score}`;
    elements.currentWord.textContent = word.word;
    elements.answerInput.value = '';
    elements.answerInput.focus();

    elements.feedback.classList.add('hidden');
    elements.nextBtn.classList.add('hidden');
    elements.submitBtn.classList.remove('hidden');
    elements.answerInput.disabled = false;
    state.answered = false;
}

// 정답 확인
async function checkAnswer() {
    if (state.answered) return;

    const word = state.words[state.currentIndex];
    const userAnswer = elements.answerInput.value.trim();

    if (!userAnswer) {
        elements.answerInput.focus();
        return;
    }

    try {
        const response = await fetch('/api/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                word: word.word,
                answer: userAnswer,
                correct: word.meaning
            })
        });

        const data = await response.json();

        if (data.success) {
            state.answered = true;
            showFeedback(data.is_correct, data.correct_answer);

            if (data.is_correct) {
                state.score++;
                elements.scoreDisplay.textContent = `정답: ${state.score}`;
            } else {
                state.wrongAnswers.push({
                    word: word.word,
                    meaning: word.meaning,
                    userAnswer: userAnswer
                });
            }
        }
    } catch (error) {
        alert('서버 연결 실패: ' + error.message);
    }
}

// 피드백 표시
function showFeedback(isCorrect, correctAnswer) {
    elements.feedback.classList.remove('hidden', 'correct', 'wrong');
    elements.feedback.classList.add(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
        elements.feedback.innerHTML = `<span class="feedback-icon">✓</span> 정답입니다!`;
    } else {
        elements.feedback.innerHTML = `<span class="feedback-icon">✗</span> 오답! 정답: ${correctAnswer}`;
    }

    elements.submitBtn.classList.add('hidden');
    elements.nextBtn.classList.remove('hidden');
    elements.answerInput.disabled = true;
}

// 다음 문제
function nextQuestion() {
    state.currentIndex++;

    if (state.currentIndex >= state.words.length) {
        showResult();
    } else {
        showQuestion();
    }
}

// 결과 표시
function showResult() {
    showScreen('result');

    const total = state.words.length;
    const score = state.score;
    const percentage = Math.round((score / total) * 100);

    elements.finalScore.textContent = score;
    elements.scoreTotal.textContent = `/ ${total}`;

    // 점수별 메시지
    let message;
    if (percentage === 100) {
        message = '🎉 완벽합니다! 모두 정답!';
    } else if (percentage >= 80) {
        message = '👏 훌륭해요! 조금만 더 노력하면 완벽!';
    } else if (percentage >= 60) {
        message = '👍 잘했어요! 틀린 단어를 복습해보세요.';
    } else if (percentage >= 40) {
        message = '💪 괜찮아요! 꾸준히 학습하면 됩니다.';
    } else {
        message = '📚 더 열심히 공부해봐요!';
    }
    elements.scoreMessage.textContent = message;

    // 틀린 문제 표시
    if (state.wrongAnswers.length > 0) {
        elements.wrongAnswers.classList.remove('hidden');
        elements.wrongList.innerHTML = state.wrongAnswers.map(item => `
            <li>
                <span class="wrong-word">${item.word}</span>
                <span class="wrong-meaning">${item.meaning}</span>
            </li>
        `).join('');
    } else {
        elements.wrongAnswers.classList.add('hidden');
    }
}

// 다시 시작
function restart() {
    showScreen('levelSelect');
}

// 이벤트 리스너
elements.submitBtn.addEventListener('click', checkAnswer);
elements.nextBtn.addEventListener('click', nextQuestion);
elements.retryBtn.addEventListener('click', restart);

// Enter 키로 제출
elements.answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (state.answered) {
            nextQuestion();
        } else {
            checkAnswer();
        }
    }
});

// ==================== 인쇄 기능 ====================

// 인쇄용 레벨 데이터 저장
let printLevels = [];

// 인쇄 화면으로 이동
async function openPrintView() {
    try {
        const response = await fetch('/api/levels');
        const data = await response.json();

        if (data.success) {
            printLevels = data.levels;

            // 레벨 선택 옵션 생성
            elements.printLevel.innerHTML = printLevels.map(level =>
                `<option value="${level.id}">${level.name} (${level.count}개)</option>`
            ).join('');

            showScreen('printView');
            generatePrintContent();
        }
    } catch (error) {
        alert('레벨 로드 실패: ' + error.message);
    }
}

// 인쇄용 콘텐츠 생성
async function generatePrintContent() {
    const levelId = elements.printLevel.value;
    const printType = elements.printType.value;

    const levelInfo = printLevels.find(l => l.id === levelId);
    const levelName = levelInfo ? levelInfo.name : levelId;

    try {
        // 전체 단어 로드 (1000개)
        const response = await fetch(`/api/words/${levelId}?count=1000`);
        const data = await response.json();

        if (!data.success) {
            elements.printContent.innerHTML = '<p>단어 로드 실패</p>';
            return;
        }

        const words = data.words;

        // 제목 및 부제목 생성
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
                        <th class="meaning-col">뜻 (정답을 적으세요)</th>
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
                        <th class="word-col">단어 (정답을 적으세요)</th>
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

    } catch (error) {
        elements.printContent.innerHTML = '<p>오류 발생: ' + error.message + '</p>';
    }
}

// 실제 인쇄 실행
function doPrint() {
    window.print();
}

// 메인 화면으로 돌아가기
function goBack() {
    showScreen('levelSelect');
}

// 인쇄 관련 이벤트 리스너
elements.printBtn.addEventListener('click', openPrintView);
elements.printLevel.addEventListener('change', generatePrintContent);
elements.printType.addEventListener('change', generatePrintContent);
elements.doPrintBtn.addEventListener('click', doPrint);
elements.backBtn.addEventListener('click', goBack);

// 초기화
loadLevels();

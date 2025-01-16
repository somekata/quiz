document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab-button");
    const sections = document.querySelectorAll(".tab-section");
    const quizList = document.getElementById("quiz-list");
    const startQuizButton = document.getElementById("start-quiz");
    const levelSelect = document.getElementById("level-select");
    const questionCountSelect = document.getElementById("question-count");
    const previewButton = document.getElementById("preview-answers");
    const resetButton = document.getElementById("reset-answers");
    const submitButton = document.getElementById("submit-answers");
    const answersReview = document.getElementById("answers-review");
    const historySection = document.getElementById("history");
    const downloadCertificateButton = document.getElementById("download-certificate");
    const quizSettings = document.getElementById("quiz-settings"); // 設定部分

    const questionStatsDiv = document.getElementById("question-stats");

    // 問題数をレベル別に集計
    function calculateQuestionStats() {
        const stats = {}; // レベル別の問題数を記録
        questionPool.forEach(question => {
            stats[question.level] = (stats[question.level] || 0) + 1;
        });

        return stats;
    }

    // レベル別の問題数を表示
    function displayQuestionStats() {
        const stats = calculateQuestionStats();
        const statsHTML = Object.entries(stats)
            .map(([level, count]) => `<p>レベル${level}: ${count}問</p>`)
            .join("");
        questionStatsDiv.innerHTML = statsHTML;
    }

    // 初期表示
    displayQuestionStats();

    let selectedQuestions = [];
    let userAnswers = {};
    let totalScore = 0;

    const history = []; // 履歴を保存する配列

    // タブ切り替え
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            sections.forEach(section => section.classList.remove("active"));
            document.getElementById(tab.dataset.tab).classList.add("active");
        });
    });

    // 問題選択と表示
    function filterQuestions(level) {
        if (level === "all") {
            return questionPool.filter(q => q.level >= 1 && q.level <= 5); // レベル1～5の問題をすべて返す
        }
        return questionPool.filter(q => q.level === parseInt(level, 10)); // 選択されたレベルのみ返す
    }
    
    function displayQuestions(questions, isLocked = false) {
        quizList.innerHTML = "";
        questions.forEach((q, index) => {
            const inputType = q.selectionCount === 1 ? "radio" : "checkbox";
            const questionElement = document.createElement("div");
            questionElement.innerHTML = `
                <h3>問題${index + 1} (レベル${q.level}): ${q.question}</h3>
                ${q.choices.map((choice, i) => `
                    <label>
                        <input type="${inputType}" name="question-${index}" value="${String.fromCharCode(97 + i)}" 
                        ${userAnswers[index]?.includes(String.fromCharCode(97 + i)) ? "checked" : ""} 
                        ${isLocked ? "disabled" : ""}>
                        ${choice}
                    </label><br>
                `).join("")}
            `;
            quizList.appendChild(questionElement);
        });

        previewButton.style.display = isLocked ? "none" : "block";
        resetButton.style.display = isLocked ? "block" : "none";
        submitButton.style.display = isLocked ? "block" : "none";
    }

    // プレビュー: チェック数のバリデーションと選択肢の固定
    previewButton.addEventListener("click", () => {
        let isValid = true;
        userAnswers = {};

        selectedQuestions.forEach((q, index) => {
            const checkedInputs = Array.from(document.querySelectorAll(`[name="question-${index}"]:checked`));
            const checkedValues = checkedInputs.map(input => input.value);

            // "all" は1つ以上チェックが必要
            if (q.selectionCount === "all" && checkedValues.length === 0) {
                alert(`問題${index + 1}: 1つ以上選択してください。`);
                isValid = false;
            } 
            // 複数または単一指定のバリデーション
            else if (q.selectionCount !== "all" && checkedValues.length !== q.selectionCount) {
                alert(`問題${index + 1}: ${q.selectionCount}つ選択してください。`);
                isValid = false;
            }

            userAnswers[index] = checkedValues;
        });

        if (isValid) {
            displayQuestions(selectedQuestions, true);
        }
    });

    // 解答しなおす: チェックを保持しつつ選択肢の固定を解除
    resetButton.addEventListener("click", () => {
        displayQuestions(selectedQuestions, false);
    });

    // 確定: 正解と解説ページに移動、履歴に追加
    submitButton.addEventListener("click", () => {
        let correctCount = 0;
        let incorrectCount = 0;
        const levelStats = {};
    
        const results = selectedQuestions.map((q, index) => {
            const correct = JSON.stringify(q.correct.sort());
            const user = JSON.stringify(userAnswers[index]?.sort() || []);
            const isCorrect = user === correct;
    
            if (isCorrect) {
                correctCount++;
                levelStats[q.level] = (levelStats[q.level] || 0) + 1;
            } else {
                incorrectCount++;
                levelStats[q.level] = (levelStats[q.level] || 0) - 1;
            }
    
            totalScore += isCorrect ? 10 : 0;
    
            // 選択肢にフィードバックを追加
            const questionElement = document.querySelectorAll(`[name="question-${index}"]`);
            questionElement.forEach((input) => {
                const label = input.parentElement;
                const markSpan = document.createElement("span"); // 印を追加するための要素
    
                if (q.correct.includes(input.value)) {
                    // 正答肢
                    markSpan.textContent = userAnswers[index]?.includes(input.value) ? "〇" : "正答肢";
                    markSpan.style.color = userAnswers[index]?.includes(input.value) ? "green" : "blue";
                } else if (userAnswers[index]?.includes(input.value)) {
                    // 不正解
                    markSpan.textContent = "×";
                    markSpan.style.color = "red";
                } else {
                    // 何も選択されていない選択肢は印なし
                    markSpan.textContent = "";
                }
    
                markSpan.style.marginLeft = "10px"; // マークと選択肢の間に余白を作る
                label.appendChild(markSpan); // 印を選択肢のラベルに追加
            });
    
            return `<h4>問題${index + 1} (レベル${q.level}): ${isCorrect ? "正解" : "不正解"}</h4>
                    <p>${q.explanation}</p>`;
        });
        const viewMessage ="<p>選択した問題の正解と解説です。選択肢などを確認する場合は問題ページに移動してください。</p><hr>";
        answersReview.innerHTML = viewMessage+results.join("");
    
        // 履歴にスコアを追加
        const selectedLevel = levelSelect.value === "all" ? "全てのレベル" : `レベル${levelSelect.value}`;
        history.push({
            level: selectedLevel,
            questionCount: selectedQuestions.length,
            correctCount,
            incorrectCount,
            levelStats,
            score: totalScore
        });
    
        updateHistorySection();
    
        document.querySelector("[data-tab='section2']").click();
        downloadCertificateButton.style.display = "block";
    
        resetButton.style.display = "none";
        submitButton.style.display = "none";
    
        quizSettings.classList.remove("hidden");
    });    

    // 履歴更新（Table形式で表示）
    function updateHistorySection() {
        const tableHeaders = `
            <tr>
                <th>履歴</th>
                <th>難易度</th>
                <th>問題数</th>
                <th>正解数</th>
                <th>不正解数</th>
                <th>スコア</th>
                <th>レベル別結果</th>
            </tr>
        `;
        const tableRows = history.map((entry, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${entry.level}</td>
                <td>${entry.questionCount}</td>
                <td>${entry.correctCount}</td>
                <td>${entry.incorrectCount}</td>
                <td>${entry.score}</td>
                <td>${Object.entries(entry.levelStats).map(([level, count]) => `
                    レベル${level}: ${count > 0 ? `${count}正解` : `${Math.abs(count)}不正解`}
                `).join(", ")}</td>
            </tr>
        `).join("");
        historySection.innerHTML = `
            <table>
                ${tableHeaders}
                ${tableRows}
            </table>
        `;
    }
    

    // 証明書ダウンロード
    downloadCertificateButton.addEventListener("click", () => {
        const certificateText = `クイズ証明書\nスコア: ${totalScore} / ${selectedQuestions.length * 10}`;
        const blob = new Blob([certificateText], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "certificate.txt";
        link.click();
    });

    // キーワードで問題をフィルタリング
function filterQuestionsByKeyword(questions, keyword) {
    if (!keyword || keyword.length < 2) {
        return questions; // キーワードが未入力または2文字未満の場合はそのまま返す
    }

    return questions.filter(q =>
        q.question.includes(keyword) || // 問題文にキーワードが含まれる
        q.choices.some(choice => choice.includes(keyword)) || // 選択肢にキーワードが含まれる
        (q.explanation && q.explanation.includes(keyword)) // 解説にキーワードが含まれる
    );
}


    // クイズ開始
    startQuizButton.addEventListener("click", () => {
        const level = levelSelect.value; // レベル選択 ("all" または 1～5)
        const questionCount = questionCountSelect.value; // 問題数 ("all" または 10, 20)
        const keyword = document.getElementById("keyword-input").value.trim(); // キーワード入力
    
        // レベルでフィルタリング
        let filteredQuestions = filterQuestions(level);
    
        // キーワードでフィルタリング
        filteredQuestions = filterQuestionsByKeyword(filteredQuestions, keyword);
    
        // 問題が選ばれない場合のエラー処理
        if (filteredQuestions.length === 0) {
            alert("選択された条件に一致する問題がありません。");
            return;
        }
    
        // 問題数を適用
        if (questionCount !== "all") {
            filteredQuestions = filteredQuestions.slice(0, parseInt(questionCount, 10));
        }
    
        // 選択された問題を設定
        selectedQuestions = filteredQuestions.sort(() => 0.5 - Math.random());
    
        // 初期化
        userAnswers = {};
        totalScore = 0;
    
        // 設定部分を非表示
        quizSettings.classList.add("hidden");
    
        // 問題を表示
        displayQuestions(selectedQuestions, false);
    });
    
    
});

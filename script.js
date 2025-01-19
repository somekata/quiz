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

    // Add event listeners for new filters
    const typeSelect = document.getElementById("type-select");
    const languageSelect = document.getElementById("language-select");    

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

    // Function to calculate and display detailed stats for each level
    function calculateDetailedQuestionStats() {
        const detailedStats = {};

        // Initialize stats structure
        for (let level = 1; level <= 5; level++) {
            detailedStats[level] = {
                日本語: { 一般: 0, 症例: 0 },
                英語: { 一般: 0, 症例: 0 }
            };
        }

        // Populate stats by iterating over the question pool
        questionPool.forEach(question => {
            const level = question.level;
            const language = question.language;
            const type = question.type;

            if (detailedStats[level] && detailedStats[level][language] && detailedStats[level][language][type] !== undefined) {
                detailedStats[level][language][type]++;
            }
        });

        return detailedStats;
    }

    // Function to display detailed stats in HTML
    function displayDetailedQuestionStats() {
        const stats = calculateDetailedQuestionStats();
        const statsHTML = Object.entries(stats)
            .map(([level, details]) => {
                const japanese = details["日本語"];
                const english = details["英語"];
                return `
                    <p>
                        レベル${level}：${japanese.一般 + japanese.症例 + english.一般 + english.症例}問
                        （日本語・一般${japanese.一般}, 日本語・症例${japanese.症例}, 
                        英語・一般${english.一般}, 英語・症例${english.症例}）
                    </p>
                `;
            })
            .join("");
        document.getElementById("question-stats").innerHTML = statsHTML;
    }

    // Initial display of detailed stats
    displayDetailedQuestionStats();

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
    // Update the filterQuestions function
    function filterQuestions(level, type, language) {
        let filteredQuestions = questionPool;
    
        // Filter by level
        if (level !== "all") {
        filteredQuestions = filteredQuestions.filter(q => q.level === parseInt(level, 10));
        }
    
        // Filter by type
        if (type !== "all") {
        filteredQuestions = filteredQuestions.filter(q => q.type === type);
        }
    
        // Filter by language
        if (language !== "all") {
        filteredQuestions = filteredQuestions.filter(q => q.language === language);
        }
    
        return filteredQuestions;
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
    
            return `<h4>問題${index + 1} ${q.question} (レベル${q.level})<br>判定: ${isCorrect ? "正解" : "不正解"}</h4>
                    <p><b>解説</b>: ${q.explanation}</p><p><b>キーワード</b>: ${q.tag}</p><p><b>言語</b>: ${q.language}, <b>タイプ</b>: ${q.type}, <b>選択肢</b>: ${q.selectionCount}択</p>`;
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
            score: totalScore,
            questionResults: selectedQuestions.map((q, index) => ({
                id: q.id, // 問題ID
                isCorrect: JSON.stringify(q.correct.sort()) === JSON.stringify(userAnswers[index]?.sort() || [])
            }))
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
                <th>問題結果 (ID:正誤)</th>
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
                <td>${entry.questionResults.map(r => `ID:${r.id}-${r.isCorrect ? '正解' : '不正解'}`).join(", ")}</td>
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

    // キーワードを問題文、選択肢、解説、タグでフィルタリング
    function filterQuestionsByKeyword(questions, keyword) {
        if (!keyword || keyword.length < 2) {
            return questions; // キーワードが未入力または2文字未満の場合は全件返す
        }

        return questions.filter(q =>
            q.question.includes(keyword) || // 問題文にキーワードが含まれる
            q.choices.some(choice => choice.includes(keyword)) || // 選択肢にキーワードが含まれる
            (q.explanation && q.explanation.includes(keyword)) || // 解説にキーワードが含まれる
            q.tag.some(tag => tag.includes(keyword)) // タグにキーワードが含まれる
        );
    }

    // Fisher-Yatesアルゴリズムによる配列シャッフル関数
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]; // 要素を交換
        }
        return array;
    }

    // クイズ開始時に問題をシャッフル
    // Update the startQuizButton event listener
startQuizButton.addEventListener("click", () => {
    const level = levelSelect.value;
    const type = typeSelect.value;
    const language = languageSelect.value;
    const keyword = document.getElementById("keyword-input").value.trim();
  
    // Apply filters
    let filteredQuestions = filterQuestions(level, type, language);
  
    // Filter by keyword
    filteredQuestions = filterQuestionsByKeyword(filteredQuestions, keyword);
  
    // Handle case where no questions are found
    if (filteredQuestions.length === 0) {
      alert("選択された条件に一致する問題が見つかりませんでした。");
      return;
    }
  
    // Shuffle and display questions
    selectedQuestions = shuffleArray(filteredQuestions).slice(0, parseInt(questionCountSelect.value, 10) || filteredQuestions.length);
    displayQuestions(selectedQuestions);
  }); 
});

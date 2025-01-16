document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.getElementById("view-toggle");
    const tableView = document.getElementById("tableview");
    const verticalView = document.getElementById("verticalview");
    const filterInput = document.createElement("input");
    const levelFilterContainer = document.createElement("div");
  
    filterInput.type = "text";
    filterInput.id = "filter-input";
    filterInput.placeholder = "検索: 問題文を入力";
    filterInput.style.marginBottom = "10px";
  
    const createLevelFilterButtons = (parentElement) => {
      const levels = [...new Set(questionPool.map((q) => q.level))].sort((a, b) => a - b);
  
      levels.forEach((level) => {
        const button = document.createElement("button");
        button.textContent = `レベル ${level}`;
        button.style.margin = "0 5px 10px 0";
        button.addEventListener("click", () => {
          filterByLevel(level);
        });
        parentElement.appendChild(button);
      });
  
      const resetButton = document.createElement("button");
      resetButton.textContent = "全てのレベル";
      resetButton.style.margin = "0 5px 10px 0";
      resetButton.addEventListener("click", () => {
        filterByLevel(null);
      });
      parentElement.appendChild(resetButton);
    };
  
    const filterByLevel = (level) => {
      if (tableView.style.display !== "none") {
        const tbody = document.querySelector("#tableview tbody");
        Array.from(tbody.rows).forEach((row, index) => {
          const questionLevel = questionPool[index].level;
          row.style.display = level === null || questionLevel === level ? "" : "none";
        });
      } else {
        const blocks = verticalView.children;
        Array.from(blocks).forEach((block, index) => {
          const questionLevel = questionPool[index].level;
          block.style.display = level === null || questionLevel === level ? "" : "none";
        });
      }
    };
  
    const createTableView = () => {
      const table = document.createElement("table");
      table.innerHTML = `
        <thead>
          <tr>
            <th>問題番号</th>
            <th>問題文と選択肢</th>
            <th>正解と解説</th>
            <th>レベル</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      `;
  
      const tbody = table.querySelector("tbody");
  
      questionPool.forEach((question, index) => {
        const row = document.createElement("tr");
  
        const choices = question.choices
          .map((choice, i) => `<li>${String.fromCharCode(97 + i)} ${choice}</li>`) // Removed bullets
          .join("");
  
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>
            <strong>${question.question}</strong>
            <ol>${question.choices.map((choice) => `<li>${choice}</li>`).join("")}</ol>
          </td>
          <td>
            <strong>正解:</strong> ${question.correct.join(", ")}<br />
            <strong>解説:</strong> ${question.explanation || "解説なし"}
          </td>
          <td>${question.level}</td>
        `;
  
        tbody.appendChild(row);
      });
  
      tableView.innerHTML = "";
      tableView.appendChild(levelFilterContainer);
      tableView.appendChild(filterInput);
      tableView.appendChild(table);
  
      filterInput.addEventListener("input", () => {
        const filterValue = filterInput.value.toLowerCase();
        Array.from(tbody.rows).forEach((row) => {
          const rowText = row.textContent.toLowerCase();
          row.style.display = rowText.includes(filterValue) ? "" : "none";
        });
      });
    };
  
    const createVerticalView = () => {
      verticalView.innerHTML = questionPool
        .map(
          (question, index) => `
          <div>
            <h2>${index + 1}. ${question.question}</h2>
            <ol>${question.choices.map((choice) => `<li>${choice}</li>`).join("")}</ol>
            <p><strong>レベル:</strong> ${question.level}</p>
            <p><strong>正解:</strong> ${question.correct.join(", ")}</p>
            <p><strong>解説:</strong> ${question.explanation || "解説なし"}</p>
          </div>
        `
        )
        .join("");
    };
  
    createLevelFilterButtons(levelFilterContainer);
    createTableView();
    createVerticalView();
  
    toggleButton.addEventListener("click", () => {
      const isTableViewActive = tableView.style.display !== "none";
      if (isTableViewActive) {
        tableView.style.display = "none";
        verticalView.style.display = "block";
        toggleButton.textContent = "切り替え: Table View";
      } else {
        tableView.style.display = "block";
        verticalView.style.display = "none";
        toggleButton.textContent = "切り替え: Vertical View";
      }
    });
  });

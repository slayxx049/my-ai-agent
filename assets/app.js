(() => {
  "use strict";

  const taskForm = document.querySelector("#taskForm");
  const taskPrompt = document.querySelector("#taskPrompt");
  const activityPanel = document.querySelector("#activityPanel");
  const activeRunCount = document.querySelector("#activeRunCount");
  const toast = document.querySelector("#toast");
  const infoDialog = document.querySelector("#infoDialog");
  const navItems = [...document.querySelectorAll(".nav-item[data-section]")];
  const menuToggle = document.querySelector("#menuToggle");
  const sidebar = document.querySelector("#sidebar");
  let taskNumber = 0;
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
  }

  function formatTime(date) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function addPreviewTask(prompt, workflow) {
    const empty = activityPanel.querySelector(".empty-state");
    if (empty) empty.remove();

    taskNumber += 1;
    const card = document.createElement("article");
    card.className = "task-item";

    const top = document.createElement("div");
    top.className = "task-item-top";

    const title = document.createElement("strong");
    title.textContent = `Preview task #${String(taskNumber).padStart(2, "0")}`;

    const status = document.createElement("span");
    status.className = "task-status";
    status.textContent = "PREVIEW ONLY";

    const description = document.createElement("p");
    description.textContent = prompt;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const workflowLabel = document.createElement("span");
    workflowLabel.textContent = workflow.toUpperCase();

    const timeLabel = document.createElement("span");
    timeLabel.textContent = formatTime(new Date());

    top.append(title, status);
    meta.append(workflowLabel, timeLabel);
    card.append(top, description, meta);
    activityPanel.prepend(card);

    activeRunCount.textContent = "00";
  }

  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const prompt = taskPrompt.value.trim();
    if (!prompt) {
      showToast("Enter a task description first.");
      taskPrompt.focus();
      return;
    }

    addPreviewTask(prompt, document.querySelector("#workflowMode").value);
    taskPrompt.value = "";
    showToast("Preview task added. No AI model was called.");
  });

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((link) => link.classList.remove("active"));
      item.classList.add("active");
      sidebar.classList.remove("open");
    });
  });

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document.querySelector("#helpButton").addEventListener("click", () => {
    infoDialog.showModal();
  });

  document.querySelector("#closeDialog").addEventListener("click", () => {
    infoDialog.close();
  });

  infoDialog.addEventListener("click", (event) => {
    if (event.target === infoDialog) infoDialog.close();
  });

  document.querySelectorAll(".muted-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showToast("This module is planned for a later phase.");
    });
  });
})();

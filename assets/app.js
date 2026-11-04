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


  // The memory API runs as a separate local service. Configure a secured HTTPS URL for deployment.
  const memoryApiBase = String(window.OMNI_API_BASE || (["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://127.0.0.1:8000" : window.location.origin)).replace(/\/$/, "");
  const memoryForm = document.querySelector("#memoryForm");
  const memoryList = document.querySelector("#memoryList");
  const memoryStatus = document.querySelector("#memoryStatus");
  const memoryCount = document.querySelector("#memoryCount");
  const memorySearch = document.querySelector("#memorySearch");
  const memoryFilter = document.querySelector("#memoryFilter");
  let memorySearchTimer;

  function setMemoryStatus(online,label){
    memoryStatus.textContent=label;
    memoryStatus.classList.toggle("online",online);
    memoryStatus.classList.toggle("offline",!online);
  }
  function showMemoryEmpty(titleText,detailText){
    memoryList.replaceChildren();
    const state=document.createElement("div");state.className="memory-empty";
    const symbol=document.createElement("span");symbol.textContent="◌";
    const title=document.createElement("strong");title.textContent=titleText;
    const detail=document.createElement("small");detail.textContent=detailText;
    state.append(symbol,title,detail);memoryList.append(state);
  }
  function createMemoryCard(memory){
    const card=document.createElement("article");card.className="memory-item";
    const head=document.createElement("div");head.className="memory-item-head";
    const title=document.createElement("h3");title.textContent=memory.title;
    const actions=document.createElement("div");actions.className="memory-actions";
    const pin=document.createElement("button");pin.type="button";pin.className="memory-action";pin.textContent=memory.pinned?"PINNED":"PIN";
    pin.addEventListener("click",()=>changeMemory(memory.id,{pinned:!memory.pinned}));
    const remove=document.createElement("button");remove.type="button";remove.className="memory-action delete";remove.textContent="DELETE";
    remove.addEventListener("click",()=>deleteMemory(memory.id));
    actions.append(pin,remove);head.append(title,actions);
    const content=document.createElement("p");content.textContent=memory.content;
    const meta=document.createElement("div");meta.className="memory-meta";
    [memory.workspace,memory.kind,memory.source||"manual"].forEach(value=>{const chip=document.createElement("span");chip.textContent=value;meta.append(chip);});
    card.append(head,content,meta);
    if(Array.isArray(memory.tags)&&memory.tags.length){const tags=document.createElement("div");tags.className="memory-meta";tags.textContent=memory.tags.map(tag=>"#"+tag).join("  ");card.append(tags);}
    return card;
  }
  async function loadMemories(){
    const params=new URLSearchParams();
    if(memoryFilter.value)params.set("workspace",memoryFilter.value);
    if(memorySearch.value.trim())params.set("q",memorySearch.value.trim());
    params.set("limit","100");
    try{
      const response=await fetch(memoryApiBase+"/api/memories?"+params.toString(),{credentials:"same-origin"});
      if(!response.ok)throw new Error("Memory API returned "+response.status);
      const items=await response.json();if(!Array.isArray(items))throw new Error("Unexpected response");
      memoryCount.textContent=items.length+(items.length===1?" RECORD":" RECORDS");memoryList.replaceChildren();
      if(!items.length){showMemoryEmpty("No memories found","Save a memory or change the workspace filter.");return;}
      items.forEach(item=>memoryList.append(createMemoryCard(item)));
    }catch(error){memoryCount.textContent="DATABASE OFFLINE";showMemoryEmpty("Memory database unavailable","Start the local backend and refresh this panel.");setMemoryStatus(false,"DATABASE OFFLINE");}
  }
  async function checkMemoryConnection(){
    try{
      const response=await fetch(memoryApiBase+"/api/health",{credentials:"same-origin"});if(!response.ok)throw new Error("Health check failed");
      const result=await response.json();if(result.status!=="ok"||result.database!=="connected")throw new Error("Database not ready");
      setMemoryStatus(true,"DATABASE CONNECTED");await loadMemories();
    }catch(error){setMemoryStatus(false,"DATABASE OFFLINE");memoryCount.textContent="0 RECORDS";showMemoryEmpty("Memory database not connected","Start the local FastAPI backend, then refresh this panel.");}
  }
  async function changeMemory(id,payload){
    try{
      const response=await fetch(memoryApiBase+"/api/memories/"+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(payload)});
      if(!response.ok)throw new Error("Update failed");await loadMemories();showToast("Memory updated.");
    }catch(error){showToast("Could not update memory. Check the database connection.");}
  }
  async function deleteMemory(id){
    if(!window.confirm("Delete this memory permanently?"))return;
    try{
      const response=await fetch(memoryApiBase+"/api/memories/"+encodeURIComponent(id),{method:"DELETE",credentials:"same-origin"});
      if(!response.ok)throw new Error("Delete failed");await loadMemories();showToast("Memory deleted.");
    }catch(error){showToast("Could not delete memory. Check the database connection.");}
  }
  memoryForm.addEventListener("submit",async event=>{
    event.preventDefault();
    const payload={
      workspace:document.querySelector("#memoryWorkspace").value,
      kind:document.querySelector("#memoryKind").value,
      title:document.querySelector("#memoryTitle").value.trim(),
      content:document.querySelector("#memoryContent").value.trim(),
      tags:document.querySelector("#memoryTags").value.split(",").map(tag=>tag.trim()).filter(Boolean).slice(0,20),
      source:"manual",pinned:false
    };
    if(!payload.title||!payload.content)return;
    const button=document.querySelector("#memorySaveButton");button.disabled=true;
    try{
      const response=await fetch(memoryApiBase+"/api/memories",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify(payload)});
      if(!response.ok)throw new Error("Save failed");memoryForm.reset();await loadMemories();showToast("Memory saved to the database.");
    }catch(error){showToast("Could not save memory. Start the local backend first.");}
    finally{button.disabled=false;}
  });
  document.querySelector("#refreshMemories").addEventListener("click",checkMemoryConnection);
  memoryFilter.addEventListener("change",loadMemories);
  memorySearch.addEventListener("input",()=>{
    window.clearTimeout(memorySearchTimer);memorySearchTimer=window.setTimeout(loadMemories,250);
  });
  document.querySelectorAll("[data-memory-workspace]").forEach(button=>{
    button.addEventListener("click",()=>{
      memoryFilter.value=button.dataset.memoryWorkspace;loadMemories();
      document.querySelector("#memory").scrollIntoView({behavior:"smooth"});
    });
  });
  checkMemoryConnection();

})();

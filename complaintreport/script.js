// ---------- API Configuration ----------
const API_BASE = window.API_BASE || window.location.origin;

// ---------- Helpers ----------
function getData(key){
  return JSON.parse(localStorage.getItem(key)) || [];
}

function setData(key, data){
  localStorage.setItem(key, JSON.stringify(data));
}

function showMsg(msg){
  alert(msg);
}

// ---------- API Helper Functions ----------
async function apiCall(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);
    
    const res = await fetch(API_BASE + endpoint, options);
    if (!res.ok) throw new Error('Server error');
    return await res.json();
  } catch (err) {
    console.error('API Error:', err);
    return null;
  }
}

// ---------- Dark Mode ----------
function initTheme(){
  const theme = localStorage.getItem("theme") || "light";
  if(theme === "dark") document.body.classList.add("dark");
}

function toggleTheme(){
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
}

// ---------- Generate Complaint ID ----------
function generateComplaintId(){
  const num = Math.floor(100000 + Math.random() * 900000);
  return "CMP" + num;
}

// ---------- Image to Base64 (store preview in LocalStorage) ----------
function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------- Image Preview ----------
async function previewImage(){
  const fileInput = document.getElementById("c_photo");
  const previewBox = document.getElementById("previewBox");
  const previewImg = document.getElementById("previewImg");

  if(!fileInput || !fileInput.files[0]) {
    if(previewBox) previewBox.style.display = "none";
    return;
  }

  const img64 = await fileToBase64(fileInput.files[0]);
  previewImg.src = img64;
  previewBox.style.display = "flex";
}

// ---------- Report Complaint ----------
async function submitComplaint(event){
  event.preventDefault();

  const fileInput = document.getElementById("c_photo");
  let photo64 = "";

  if(fileInput.files[0]){
    photo64 = await fileToBase64(fileInput.files[0]);
  }

  const complaint = {
    id: generateComplaintId(),
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    name: document.getElementById("c_name").value.trim(),
    phone: document.getElementById("c_phone").value.trim(),
    category: document.getElementById("c_category").value,
    location: document.getElementById("c_location").value.trim(),
    description: document.getElementById("c_desc").value.trim(),
    status: "pending",
    photo: photo64 || null
  };

  // Try to send to backend
  const result = await apiCall('/api/complaints', 'POST', complaint);

  if(result && result.id) {
    // Successfully saved to backend
    event.target.reset();
    const previewBox = document.getElementById("previewBox");
    if(previewBox) previewBox.style.display = "none";
    showMsg(`Complaint Submitted!\nYour Complaint ID: ${result.id}`);
  } else {
    // Fallback: save locally
    const complaints = getData("complaints");
    complaints.unshift(complaint);
    setData("complaints", complaints);

    event.target.reset();
    const previewBox = document.getElementById("previewBox");
    if(previewBox) previewBox.style.display = "none";

    showMsg(`Offline: Complaint saved locally.\nYour Complaint ID: ${complaint.id}`);
  }
}

// ---------- Track Complaint ----------
async function trackComplaint(){
  const input = document.getElementById("trackId").value.trim().toUpperCase();
  const box = document.getElementById("trackResult");

  if(!box) return;

  // Try API first
  const found = await apiCall('/api/complaints/' + input);
  
  // Fallback to localStorage
  if (!found) {
    const complaints = getData("complaints");
    const localFound = complaints.find(c => c.id === input);
    if (!localFound) {
      box.innerHTML = `<div class="card"><h2>Not Found</h2><p>No complaint found with ID: <b>${input}</b></p></div>`;
      return;
    }
    displayComplaintDetail(localFound, box);
    return;
  }

  displayComplaintDetail(found, box);
}

function displayComplaintDetail(complaint, box) {
  box.innerHTML = `
    <div class="card">
      <h2>Complaint Status</h2>
      <p><b>ID:</b> ${complaint.id}</p>
      <p><b>Status:</b> <span class="badge ${complaint.status}">
        ${complaint.status.toUpperCase()}
      </span></p>
      <p><b>Category:</b> ${complaint.category}</p>
      <p><b>Department:</b> <span style="color: #1565c0; font-weight: bold;">${complaint.department || 'Unassigned'}</span></p>
      <p><b>Location:</b> ${complaint.location}</p>
      <p><b>Created:</b> ${complaint.createdAt}</p>
      <p><b>Description:</b> ${complaint.description}</p>
      ${complaint.assignedTo ? `<p><b>Assigned To:</b> ${complaint.assignedTo}</p>` : ''}
      ${complaint.photo ? `<div class="preview" style="display:flex;margin-top:10px">
        <img src="${complaint.photo}" alt="Photo">
        <small>Uploaded proof image</small>
      </div>` : `<small>No photo uploaded</small>`}
    </div>
  `;
}

// ---------- Admin Render ----------
function loadAdmin(){
  renderComplaints();
}

async function renderComplaints(){
  // Fetch from API
  let complaints = await apiCall('/api/complaints');
  let staffList = await apiCall('/api/staff');
  
  // Fallback to localStorage
  if (!complaints) {
    complaints = getData("complaints");
  }
  if (!staffList) staffList = [];

  const tbody = document.getElementById("complaintBody");

  const search = (document.getElementById("searchText")?.value || "").toLowerCase();
  const filterCategory = document.getElementById("filterCategory")?.value || "ALL";
  const filterStatus = document.getElementById("filterStatus")?.value || "ALL";
  const filterDepartment = document.getElementById("filterDepartment")?.value || "ALL";

  if(!tbody) return;

  const filtered = complaints.filter(c => {
    const searchOk =
      c.id.toLowerCase().includes(search) ||
      c.name.toLowerCase().includes(search) ||
      c.phone.toLowerCase().includes(search) ||
      c.location.toLowerCase().includes(search);

    const catOk = filterCategory === "ALL" ? true : c.category === filterCategory;
    const statusOk = filterStatus === "ALL" ? true : c.status === filterStatus;
    const deptOk = filterDepartment === "ALL" ? true : (c.department === filterDepartment);

    return searchOk && catOk && statusOk && deptOk;
  });

  tbody.innerHTML = "";

  filtered.forEach((c, i) => {
    // Build staff dropdown
    let staffDropdown = `<select onchange="handleStaffAssignment('${c.id}', this)" 
                                  style="padding: 5px; border-radius: 6px; width: 140px;">
      <option value="">-- Unassigned --</option>`;
    
    staffList.forEach(staff => {
      const selected = c.assignedToId === staff.id ? 'selected' : '';
      staffDropdown += `<option value="${staff.id}" data-name="${staff.name}" ${selected}>${staff.id} - ${staff.name}</option>`;
    });
    staffDropdown += `</select>`;

    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${c.id}</td>
        <td>${c.category}</td>
        <td><small>${c.department || 'Unassigned'}</small></td>
        <td>${c.location}</td>
        <td><span class="badge ${c.status}">${c.status.toUpperCase()}</span></td>
        <td>${c.createdAt}</td>
        <td>
          <select onchange="updateStatus('${c.id}', this.value)">
            <option value="pending" ${c.status==="pending"?"selected":""}>Pending</option>
            <option value="progress" ${c.status==="progress"?"selected":""}>In Progress</option>
            <option value="resolved" ${c.status==="resolved"?"selected":""}>Resolved</option>
          </select>
        </td>
        <td>${staffDropdown}</td>
        <td>
          <button class="dangerBtn" onclick="deleteComplaint('${c.id}')">Delete</button>
        </td>
      </tr>
    `;
  });

  if(filtered.length === 0){
    tbody.innerHTML = `<tr><td colspan="10">No complaints found.</td></tr>`;
  }
}

// Handle staff assignment from dropdown
function handleStaffAssignment(complaintId, selectElement){
  const staffId = selectElement.value;
  const staffName = selectElement.options[selectElement.selectedIndex].getAttribute('data-name') || '';
  
  assignComplaint(complaintId, staffId, staffName);
}

// ---------- Update Status ----------
async function updateStatus(id, newStatus){
  // Try API first
  const success = await apiCall(`/api/complaints/${id}/status`, 'PUT', { status: newStatus });
  
  if (!success) {
    // Fallback to localStorage
    const complaints = getData("complaints");
    const index = complaints.findIndex(c => c.id === id);
    if(index === -1) return;
    complaints[index].status = newStatus;
    setData("complaints", complaints);
  }
  
  renderComplaints();
}

// ---------- Delete Complaint ----------
async function deleteComplaint(id){
  if(!confirm("Delete this complaint?")) return;

  // Try API first
  const success = await apiCall(`/api/complaints/${id}`, 'DELETE');
  
  if (!success) {
    // Fallback to localStorage
    const complaints = getData("complaints");
    const updated = complaints.filter(c => c.id !== id);
    setData("complaints", updated);
  }
  
  renderComplaints();
  showMsg(" Complaint Deleted!");
}

// ---------- Assign Complaint ----------
async function assignComplaint(id, staffId, staffName){
  if(!staffId){
    await apiCall(`/api/complaints/${id}/assign`, 'PUT', { assignedToId: null, assignedTo: null });
    showMsg("Assignment cleared");
  } else {
    const success = await apiCall(`/api/complaints/${id}/assign`, 'PUT', { 
      assignedToId: staffId,
      assignedTo: staffName
    });
    
    if(success){
      showMsg(`✅ Assigned to ${staffName} (${staffId})`);
    }
  }
  
  renderComplaints();
}

// ---------- Clear All ----------
function clearAll(){
  if(confirm("Clear ALL complaints data?")){
    localStorage.removeItem("complaints");
    showMsg(" All complaints cleared!");
    location.reload();
  }
}
// ---------- Admin Auth (Frontend Only) ----------
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin@123";

function adminLogin(event){
  event.preventDefault();

  const u = document.getElementById("adminUser").value.trim();
  const p = document.getElementById("adminPass").value.trim();

  if(u === ADMIN_USERNAME && p === ADMIN_PASSWORD){
    localStorage.setItem("adminLoggedIn", "true");
    showMsg(" Login Successful!");
    window.location.href = "admin.html";
  } else {
    showMsg(" Invalid Username or Password!");
  }
}

function checkAdminAccess(){
  const loggedIn = localStorage.getItem("adminLoggedIn");
  if(loggedIn !== "true"){
    // redirect to login page
    window.location.href = "login.html";
  }
}

function adminLogout(){
  localStorage.removeItem("adminLoggedIn");
  showMsg(" Logged out successfully!");
  window.location.href = "login.html";
}

// ---------- Staff Functions ----------
async function validateStaffLogin(event){
  event.preventDefault();

  const staffId = document.getElementById("staffId").value.trim().toUpperCase();

  if(!staffId || staffId.length < 3){
    showMsg("Please enter a valid Staff ID");
    return;
  }

  // Validate against backend
  const staffData = await apiCall(`/api/staff/validate/${staffId}`, 'POST');

  if(!staffData){
    showMsg("❌ Invalid Staff ID or account is inactive. Try: STF001, STF002, etc.");
    return;
  }

  localStorage.setItem("staffLoggedIn", "true");
  localStorage.setItem("staffId", staffId);
  localStorage.setItem("staffData", JSON.stringify(staffData));
  showMsg("✅ Login Successful! Welcome " + staffData.name);
  window.location.href = "staff-dashboard.html";
}

function checkStaffAccess(){
  const loggedIn = localStorage.getItem("staffLoggedIn");
  if(loggedIn !== "true"){
    window.location.href = "staff-login.html";
  }
  
  const staffData = JSON.parse(localStorage.getItem("staffData") || '{}');
  const staffName = staffData.name || "Staff";
  const nameDisplay = document.getElementById("staffNameDisplay");
  if(nameDisplay) nameDisplay.textContent = "👤 " + staffName + " (" + staffData.department + ")";
}

async function loadStaffDashboard(){
  const staffId = localStorage.getItem("staffId");
  const staffData = JSON.parse(localStorage.getItem("staffData") || '{}');
  
  if(!staffId){
    window.location.href = "staff-login.html";
    return;
  }

  // Fetch all complaints from API
  let complaints = await apiCall('/api/complaints');
  
  // Fallback to localStorage
  if(!complaints){
    complaints = getData("complaints") || [];
  }

  // Filter only complaints assigned to this staff member (by ID)
  let assigned = complaints.filter(c => c.assignedToId === staffId);

  const tbody = document.getElementById("staffComplaintBody");
  const search = (document.getElementById("staffSearchText")?.value || "").toLowerCase();
  const filterStatus = document.getElementById("staffFilterStatus")?.value || "ALL";
  const filterCategory = document.getElementById("staffFilterCategory")?.value || "ALL";

  if(!tbody) return;

  // Apply filters
  const filtered = assigned.filter(c => {
    const searchOk = 
      c.id.toLowerCase().includes(search) ||
      c.name.toLowerCase().includes(search) ||
      c.location.toLowerCase().includes(search);

    const statusOk = filterStatus === "ALL" ? true : c.status === filterStatus;
    const catOk = filterCategory === "ALL" ? true : c.category === filterCategory;

    return searchOk && statusOk && catOk;
  });

  tbody.innerHTML = "";

  filtered.forEach((c, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td><b>${c.id}</b></td>
        <td>${c.category}</td>
        <td>${c.location}</td>
        <td>${c.description.substring(0, 40)}...</td>
        <td><span class="badge ${c.status}">${c.status.toUpperCase()}</span></td>
        <td>${c.createdAt}</td>
        <td>
          <select onchange="updateStaffComplaintStatus('${c.id}', this.value)" 
                  style="padding: 5px; border-radius: 6px;">
            <option value="pending" ${c.status==="pending"?"selected":""}>Pending</option>
            <option value="progress" ${c.status==="progress"?"selected":""}>In Progress</option>
            <option value="resolved" ${c.status==="resolved"?"selected":""}>Resolved</option>
          </select>
        </td>
        <td>
          <input type="text" placeholder="Add note..." id="note-${c.id}" 
                 style="width: 100px; padding: 5px; font-size: 12px;">
        </td>
      </tr>
    `;
  });

  if(filtered.length === 0){
    tbody.innerHTML = `<tr><td colspan="9"><center>No assigned complaints</center></td></tr>`;
  }

  // Update summary counts
  updateStaffSummary(assigned);
}

function updateStaffSummary(complaints){
  const pendingCount = complaints.filter(c => c.status === "pending").length;
  const progressCount = complaints.filter(c => c.status === "progress").length;
  const resolvedCount = complaints.filter(c => c.status === "resolved").length;
  const total = complaints.length;

  document.getElementById("countPending").textContent = pendingCount;
  document.getElementById("countProgress").textContent = progressCount;
  document.getElementById("countResolved").textContent = resolvedCount;
  document.getElementById("countTotal").textContent = total;
}

async function updateStaffComplaintStatus(id, newStatus){
  // Try API first
  const success = await apiCall(`/api/complaints/${id}/status`, 'PUT', { status: newStatus });
  
  if (!success) {
    // Fallback to localStorage
    const complaints = getData("complaints");
    const index = complaints.findIndex(c => c.id === id);
    if(index === -1) return;
    complaints[index].status = newStatus;
    setData("complaints", complaints);
  }
  
  showMsg(`Status updated to ${newStatus.toUpperCase()}!`);
  loadStaffDashboard();
}

function staffLogout(){
  localStorage.removeItem("staffLoggedIn");
  localStorage.removeItem("staffId");
  localStorage.removeItem("staffData");
  showMsg(" Logged out successfully!");
  window.location.href = "staff-login.html";
}

// ---------- Staff Management (Admin) ----------
async function loadStaffList(){
  const staffList = await apiCall('/api/staff');
  
  if(!staffList){
    showMsg("Error loading staff list");
    return;
  }

  const tbody = document.getElementById("staffListBody");
  if(!tbody) return;

  tbody.innerHTML = "";

  staffList.forEach((staff, i) => {
    const assignedCount = Array.isArray(staff.complaints) ? staff.complaints.filter(c => c.status !== 'resolved').length : 0;
    
    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td><b>${staff.id}</b></td>
        <td>${staff.name}</td>
        <td>${staff.email || '-'}</td>
        <td>${staff.phone || '-'}</td>
        <td>${staff.department || '-'}</td>
        <td>${staff.position || '-'}</td>
        <td><span style="background: #e3f2fd; padding: 4px 8px; border-radius: 4px;">${assignedCount} active</span></td>
        <td><span class="badge ${staff.status === 'active' ? 'progress' : 'pending'}">${staff.status.toUpperCase()}</span></td>
        <td>
          <button class="dangerBtn" onclick="deleteStaffMember('${staff.id}')">Deactivate</button>
        </td>
      </tr>
    `;
  });

  if(staffList.length === 0){
    tbody.innerHTML = `<tr><td colspan="10"><center>No staff members</center></td></tr>`;
  }
}

async function addStaff(event){
  event.preventDefault();

  const id = document.getElementById("staffNewId").value.trim().toUpperCase();
  const name = document.getElementById("staffNewName").value.trim();
  const email = document.getElementById("staffNewEmail").value.trim();
  const phone = document.getElementById("staffNewPhone").value.trim();
  const department = document.getElementById("staffNewDepartment").value;
  const position = document.getElementById("staffNewPosition").value.trim();

  if(!id || !name || !department){
    showMsg("Staff ID, Name, and Department are required!");
    return;
  }

  const result = await apiCall('/api/staff', 'POST', {
    id, name, email, phone, department, position
  });

  if(result){
    showMsg(`✅ Staff member ${name} (${id}) added successfully!`);
    event.target.reset();
    loadStaffList();
  } else {
    showMsg("Error adding staff member");
  }
}

async function deleteStaffMember(staffId){
  if(!confirm("Deactivate this staff member? They won't be able to log in.")) return;

  const result = await apiCall(`/api/staff/${staffId}`, 'DELETE');

  if(result){
    showMsg("✅ Staff member deactivated!");
    loadStaffList();
  } else {
    showMsg("Error deactivating staff member");
  }
}

// ---------- Get Staff List for Dropdown (Admin Assignment) ----------
async function getStaffForAssignment(){
  const staffList = await apiCall('/api/staff');
  return staffList || [];
}

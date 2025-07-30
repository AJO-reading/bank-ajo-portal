// app.js – Bank of AJO Funder Portal (client-side SPA)
// Stores proposals in localStorage so submissions persist across page reloads.

/*****************
 * CONFIGURATION *
 *****************/
const USERS = {
  User1: "password1",
  User2: "password2",
  User3: "password3",
};

/****************
 * GLOBAL STATE *
 ****************/
const STORAGE_KEY = "bap_proposals";
const state = {
  authUser: null, // current username string, or null if not authenticated
  proposals: [],  // array of submitted proposal objects persisted in localStorage
};

function loadProposals() {
  try {
    state.proposals = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    state.proposals = [];
  }
}

function saveProposals() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.proposals));
}

// Initialise proposals from storage on first load
loadProposals();

/*******************
 * UTILITY HELPERS *
 *******************/
const $ = (sel, scope = document) => scope.querySelector(sel);
const createEl = (tag, attrs = {}, html = "") => {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  el.innerHTML = html;
  return el;
};
function navigate(hash) {
  window.location.hash = hash;
}
function clearApp() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  return app;
}
function randomStatus() {
  return ["Accepted", "Declined", "Referred"][Math.floor(Math.random() * 3)];
}

/*********************
 * ROUTER & NAV GUARD *
 *********************/
window.addEventListener("hashchange", router);
document.addEventListener("DOMContentLoaded", router);
if (document.readyState !== "loading") {
  router();
}

function router() {
  const hash = window.location.hash || "#login";

  // Guard: redirect to login if not authenticated (except for #login)
  if (!state.authUser && hash !== "#login") {
    return navigate("#login");
  }

  // Guard: if already authenticated, hitting #login should send to dashboard
  if (state.authUser && hash === "#login") {
    return navigate("#dashboard");
  }

  switch (true) {
    case /^#login$/.test(hash):
      return renderLogin();
    case /^#dashboard$/.test(hash):
      return renderDashboard();
    case /^#new$/.test(hash):
      return renderNewProposal();
    case /^#submissions$/.test(hash):
      return renderSubmissions();
    case /^#confirm\/.+/.test(hash):
      const id = hash.split("/")[1];
      return renderConfirmation(id);
    default:
      navigate("#login");
  }
}

/**********************
 * SHARED UI ELEMENTS *
 **********************/
function renderHeader(root) {
  const header = createEl(
    "nav",
    { class: "navbar navbar-expand-lg app-header px-3 mb-4" },
    `<a href="#dashboard" class="navbar-brand d-flex align-items-center gap-2">
        <img src="https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/7863599f-31e7-4d7b-9cec-70eeac7a279e.png" alt="Bank of AJO logo" height="40" />
        <span class="fw-semibold">Bank of AJO</span>
      </a>
      <div class="ms-auto d-flex align-items-center gap-3">
        <span class="text-secondary">Welcome, ${state.authUser}</span>
        <button class="btn btn-sm btn-outline-secondary" id="logoutBtn" type="button">Logout</button>
      </div>`
  );
  header.querySelector("#logoutBtn").addEventListener("click", () => {
    state.authUser = null;
    navigate("#login");
  });
  root.appendChild(header);
}

/****************
 * VIEW: LOGIN  *
 ****************/
function renderLogin() {
  const app = clearApp();
  document.title = "Sign in – Bank of AJO";

  const wrapper = createEl("div", { class: "center-screen w-100" });
  wrapper.innerHTML = `
    <div class="card p-4" style="min-width:320px;max-width:400px;width:100%;">
      <div class="text-center mb-4">
        <img src="https://user-gen-media-assets.s3.amazonaws.com/gpt4o_images/7863599f-31e7-4d7b-9cec-70eeac7a279e.png" alt="Bank of AJO logo" class="logo mb-3" />
        <h2 class="h4">Bank of AJO Portal</h2>
      </div>
      <div id="loginAlert" class="alert alert-danger d-none" role="alert">Invalid credentials. Please try again.</div>
      <form id="loginForm" novalidate>
        <div class="form-floating mb-3">
          <input type="text" name="username" class="form-control" id="username" placeholder="User1" aria-label="Username" />
          <label for="username">Username</label>
        </div>
        <div class="form-floating mb-3">
          <input type="password" name="password" class="form-control" id="password" placeholder="••••" aria-label="Password" />
          <label for="password">Password</label>
        </div>
        <button type="submit" class="btn btn-primary w-100">Sign in</button>
      </form>
    </div>`;
  app.appendChild(wrapper);

  const loginForm = $("#loginForm", wrapper);
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const usernameInput = loginForm.username.value.trim();
    const passwordInput = loginForm.password.value;

    // case-insensitive username check
    const validUserKey = Object.keys(USERS).find(
      (u) => u.toLowerCase() === usernameInput.toLowerCase()
    );

    if (validUserKey && USERS[validUserKey] === passwordInput) {
      state.authUser = validUserKey; // store original casing
      navigate("#dashboard");
    } else {
      $("#loginAlert", wrapper).classList.remove("d-none");
    }
  });
}

/*******************
 * VIEW: DASHBOARD *
 *******************/
function renderDashboard() {
  const app = clearApp();
  document.title = "Dashboard – Bank of AJO";
  renderHeader(app);

  const container = createEl(
    "div",
    { class: "container flex flex-col items-center gap-16 mt-8" },
    `<div class="row w-100 g-4">
      <div class="col-12 col-md-6 d-grid">
        <button class="btn btn-primary dashboard-btn" id="newProposalBtn">New Proposal</button>
      </div>
      <div class="col-12 col-md-6 d-grid">
        <button class="btn btn-secondary dashboard-btn" id="checkSubmissionsBtn">Check Submissions</button>
      </div>
    </div>`
  );
  app.appendChild(container);

  $("#newProposalBtn", container).addEventListener("click", () => navigate("#new"));
  $("#checkSubmissionsBtn", container).addEventListener("click", () => navigate("#submissions"));
}

/************************
 * VIEW: NEW PROPOSAL   *
 ************************/
function renderNewProposal() {
  const app = clearApp();
  document.title = "New Proposal – Bank of AJO";
  renderHeader(app);

  const container = createEl("div", { class: "container mb-5" });
  container.innerHTML = `
    <h3 class="mb-4">New Credit Proposal</h3>
    <form id="proposalForm">
      <!-- Applicant Details -->
      <div class="card section-card">
        <div class="card-header fw-semibold">Applicant Details</div>
        <div class="card-body row g-3">
          <div class="col-md-2">
            <label class="form-label">Title</label>
            <select name="title" class="form-select" aria-label="Title">
              <option>Mr</option><option>Mrs</option><option>Miss</option><option>Ms</option>
            </select>
          </div>
          <div class="col-md-5">
            <label class="form-label">First Name</label>
            <input type="text" name="firstName" class="form-control" />
          </div>
          <div class="col-md-5">
            <label class="form-label">Last Name</label>
            <input type="text" name="lastName" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Date of Birth</label>
            <input type="date" name="dob" class="form-control" />
          </div>
        </div>
      </div>

      <!-- Employment Details -->
      <div class="card section-card">
        <div class="card-header fw-semibold">Employment Details</div>
        <div class="card-body row g-3">
          <div class="col-md-6">
            <label class="form-label">Employer Name</label>
            <input type="text" name="employer" class="form-control" />
          </div>
          <div class="col-md-6">
            <label class="form-label">Job Title</label>
            <input type="text" name="jobTitle" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Employment Start Date</label>
            <input type="date" name="startDate" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Annual income (£)</label>
            <input type="number" name="income" class="form-control" />
          </div>
        </div>
      </div>

      <!-- Current Address -->
      <div class="card section-card">
        <div class="card-header fw-semibold">Current Address</div>
        <div class="card-body row g-3 align-items-end">
          <div class="col-md-8">
            <label class="form-label">Address Line 1</label>
            <input type="text" name="currAddress1" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Address Line 2</label>
            <input type="text" name="currAddress2" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">City</label>
            <input type="text" name="currCity" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Postcode</label>
            <div class="input-group">
              <input type="text" name="currPostcode" class="form-control" />
              <button type="button" id="lookupBtn" class="btn btn-outline-secondary">Lookup</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Previous Address (optional) -->
      <div class="card section-card">
        <div class="card-header fw-semibold d-flex justify-content-between align-items-center">
          Previous Address (optional)
          <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-toggle="collapse" data-bs-target="#prevBody">Toggle</button>
        </div>
        <div class="collapse" id="prevBody">
          <div class="card-body row g-3">
            <div class="col-md-8">
              <label class="form-label">Address Line 1</label>
              <input type="text" name="prevAddress1" class="form-control" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Address Line 2</label>
              <input type="text" name="prevAddress2" class="form-control" />
            </div>
            <div class="col-md-4">
              <label class="form-label">City</label>
              <input type="text" name="prevCity" class="form-control" />
            </div>
            <div class="col-md-4">
              <label class="form-label">Postcode</label>
              <input type="text" name="prevPostcode" class="form-control" />
            </div>
          </div>
        </div>
      </div>

      <!-- Bank Details -->
      <div class="card section-card">
        <div class="card-header fw-semibold">Bank Details</div>
        <div class="card-body row g-3">
          <div class="col-md-4">
            <label class="form-label">Sort Code</label>
            <input type="text" name="sortCode" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Account Number</label>
            <input type="text" name="accountNumber" class="form-control" />
          </div>
        </div>
      </div>

      <!-- Loan Details -->
      <div class="card section-card">
        <div class="card-header fw-semibold">Loan Details</div>
        <div class="card-body row g-3">
          <div class="col-md-4">
            <label class="form-label">Loan Amount (£)</label>
            <input type="number" name="loanAmount" class="form-control" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Term (months)</label>
            <select name="loanTerm" class="form-select">${[12,24,36,48,60].map(m=>`<option>${m}</option>`).join("")}</select>
          </div>
        </div>
      </div>

      <div class="text-end mb-5">
        <button type="submit" class="btn btn-primary">Submit Proposal</button>
      </div>
    </form>`;
  app.appendChild(container);

  // Postcode lookup button
  $("#lookupBtn", container).addEventListener("click", () => {
    $("input[name='currAddress1']", container).value = "1 Test Street";
    $("input[name='currCity']", container).value = "Testville";
  });

  // Form submit handler
  $("#proposalForm", container).addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target).entries());
    const proposalId = `PID-${Date.now()}`;
    const status = randomStatus();

    // Generate PDF via global jsPDF (loaded in index.html)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Bank of AJO – Proposal ${proposalId}`, 10, 20);
    doc.setFontSize(12);
    doc.text(`Status: ${status}`, 10, 30);
    let y = 40;
    for (const [key, val] of Object.entries(formData)) {
      doc.text(`${key}: ${val}`, 10, y);
      y += 8;
      if (y > 280) { doc.addPage(); y = 20; }
    }
    const pdfBlob = doc.output("blob");
    let pdfUrl;
    if (window.URL && URL.createObjectURL) {
      pdfUrl = URL.createObjectURL(pdfBlob);
    } else {
      pdfUrl = doc.output("datauristring");
    }

    // Store proposal in state
    const proposalObj = {
      id: proposalId,
      applicant: `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
      loanAmount: formData.loanAmount || "",
      status,
      pdfUrl,
      data: formData,
    };
    state.proposals.push(proposalObj);
    saveProposals();

    // Simulate webhook (ignore errors)
    fetch("https://webhook.site/mock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proposalObj),
    }).catch(() => {});

    // Trigger PDF download
    doc.save(`${proposalId}.pdf`);

    // Navigate to confirmation page
    navigate(`#confirm/${proposalId}`);
  });
}

/***********************
 * VIEW: CONFIRMATION  *
 ***********************/
function renderConfirmation(proposalId) {
  const proposal = state.proposals.find((p) => p.id === proposalId);
  if (!proposal) return navigate("#dashboard");

  const app = clearApp();
  document.title = "Proposal Confirmation – Bank of AJO";
  renderHeader(app);

  const container = createEl(
    "div",
    { class: "container mt-4" },
    `<div class="alert alert-info">
       <h4 class="alert-heading">Proposal Submitted!</h4>
       <p class="mb-1">Proposal ID: <strong>${proposal.id}</strong></p>
       <p class="mb-3">Status: <strong>${proposal.status}</strong></p>
       <hr class="my-2">
       <p class="mb-0">You can return to Dashboard or view all submissions.</p>
     </div>
     <div class="d-flex gap-3">
       <a href="#dashboard" class="btn btn-primary">Dashboard</a>
       <a href="#submissions" class="btn btn-secondary">Check Submissions</a>
     </div>`
  );
  app.appendChild(container);
}

/********************
 * VIEW: SUBMISSIONS *
 ********************/
function renderSubmissions() {
  const app = clearApp();
  document.title = "Submissions – Bank of AJO";
  renderHeader(app);

  const container = createEl(
    "div",
    { class: "container mt-4" },
    `<h3 class="mb-4">Submitted Proposals</h3>
     <div class="table-responsive">
       <table class="table table-striped" id="subsTable">
         <thead>
           <tr>
            <th>Proposal ID</th><th>Applicant</th><th>Loan Amount (£)</th><th>Status</th><th>PDF</th><th></th>
           </tr>
         </thead>
         <tbody></tbody>
       </table>
     </div>`
  );
  app.appendChild(container);

  populateSubmissionsTable();
}
function populateSubmissionsTable() {
  const tbody = $("#subsTable tbody");
  if (!tbody) return;
  tbody.innerHTML = state.proposals
    .map((p) => {
      const badge = p.status === "Accepted" ? "success" : p.status === "Declined" ? "danger" : "warning";
      return `<tr>
        <td>${p.id}</td>
        <td>${p.applicant}</td>
        <td>${p.loanAmount}</td>
        <td><span class="badge bg-${badge}">${p.status}</span></td>
        <td><a href="${p.pdfUrl}" target="_blank" class="btn btn-sm btn-outline-primary">Download</a></td>
        <td><button class="btn btn-sm btn-outline-danger delete-btn" data-id="${p.id}">Delete</button></td>
      </tr>`;
    })
    .join("");

  tbody.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      state.proposals = state.proposals.filter((pr) => pr.id !== id);
      saveProposals();
      populateSubmissionsTable();
    });
  });
}

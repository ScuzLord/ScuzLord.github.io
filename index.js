// --- State Management ---
const state = {
    currentView: 'applicant', // 'applicant', 'login', 'admin'
    isLoggedIn: false,
    applications: [],
};

// --- DOM Elements ---
const applicantView = document.getElementById('applicant-view');
const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');

const adminLoginLink = document.getElementById('admin-login-link');
const applicantViewLink = document.getElementById('applicant-view-link');
const logoutButton = document.getElementById('logout-button');

const applicationForm = document.getElementById('application-form');
const loginForm = document.getElementById('login-form');

const submitButton = document.getElementById('submit-button');
const submitButtonText = document.getElementById('submit-button-text');
const submitSpinner = document.getElementById('submit-spinner');
const successMessage = document.getElementById('success-message');
const loginError = document.getElementById('login-error');

const applicationsListContainer = document.getElementById('applications-list');

// --- Helper Functions ---

/**
 * Reads a file and returns its name and Data URL as a promise.
 * @param {File} file The file to read.
 * @returns {Promise<{name: string, dataUrl: string}>}
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

/**
 * Loads applications from localStorage.
 */
function loadApplications() {
    try {
        const storedApps = localStorage.getItem('applications');
        state.applications = storedApps ? JSON.parse(storedApps) : [];
    } catch (e) {
        console.error("Failed to load applications from localStorage", e);
        state.applications = [];
    }
}

/**
 * Saves applications to localStorage.
 */
function saveApplications() {
    try {
        localStorage.setItem('applications', JSON.stringify(state.applications));
    } catch (e) {
        console.error("Failed to save applications to localStorage", e);
    }
}

/**
 * Checks session storage for logged-in status.
 */
function checkLoginStatus() {
    state.isLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';
}

// --- Render Functions ---

/**
 * Updates which view is visible.
 */
function updateView() {
    applicantView.classList.toggle('hidden', state.currentView !== 'applicant');
    loginView.classList.toggle('hidden', state.currentView !== 'login');
    adminView.classList.toggle('hidden', state.currentView !== 'admin');
    
    adminLoginLink.classList.toggle('hidden', state.currentView !== 'applicant');
    applicantViewLink.classList.toggle('hidden', state.currentView === 'applicant');


    if (state.currentView === 'admin') {
        if (!state.isLoggedIn) {
            navigateTo('login');
            return;
        }
        renderAdminDashboard();
    }
}

/**
 * Renders the list of applications in the admin dashboard.
 */
function renderAdminDashboard() {
    if (state.applications.length === 0) {
        applicationsListContainer.innerHTML = `<p class="text-slate-500 text-center">No applications submitted yet.</p>`;
        return;
    }

    applicationsListContainer.innerHTML = `
        <div class="space-y-4">
            ${state.applications.map((app, index) => `
                <div class="border border-slate-200 rounded-lg p-4 transition-shadow hover:shadow-md">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-bold text-lg text-indigo-700">${app.fullName}</h3>
                            <p class="text-sm text-slate-600">${app.email} | ${app.phone}</p>
                            <p class="text-xs text-slate-400 mt-1">Submitted: ${new Date(app.submittedAt).toLocaleString()}</p>
                        </div>
                        <div class="text-right">
                           <p class="text-sm font-medium text-slate-700">Documents</p>
                           <div class="flex flex-col items-end mt-1 space-y-1">
                             ${app.files.map(file => file ? `
                                <a href="${file.dataUrl}" download="${file.name}" class="text-sm text-indigo-600 hover:underline">
                                    ${file.name}
                                </a>` : ''
                             ).join('')}
                           </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// --- Event Handlers & Logic ---

function navigateTo(view) {
    state.currentView = view;
    updateView();
}

async function handleApplicationSubmit(event) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.target);
    const filesToRead = [
        formData.get('resume'),
        formData.get('coverLetter'),
        formData.get('transcripts'),
    ];

    try {
        const files = await Promise.all(filesToRead.map(readFileAsDataURL));

        const newApplication = {
            id: Date.now(),
            submittedAt: new Date().toISOString(),
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            files: files,
        };

        state.applications.push(newApplication);
        saveApplications();
        
        applicationForm.reset();
        successMessage.classList.remove('hidden');
        setTimeout(() => successMessage.classList.add('hidden'), 5000);

    } catch (error) {
        console.error("Error processing application:", error);
        alert("There was an error submitting your application. Please try again.");
    } finally {
        setLoading(false);
    }
}

function handleAdminLogin(event) {
    event.preventDefault();
    loginError.classList.add('hidden');
    const formData = new FormData(event.target);
    const username = formData.get('username');
    const password = formData.get('password');

    // IMPORTANT: This is NOT secure and for demonstration purposes only.
    if (username === 'admin' && password === 'password123') {
        state.isLoggedIn = true;
        sessionStorage.setItem('isAdminLoggedIn', 'true');
        loginForm.reset();
        navigateTo('admin');
    } else {
        loginError.classList.remove('hidden');
    }
}

function handleLogout() {
    state.isLoggedIn = false;
    sessionStorage.removeItem('isAdminLoggedIn');
    navigateTo('login');
}

function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButtonText.classList.toggle('hidden', isLoading);
    submitSpinner.classList.toggle('hidden', !isLoading);
}


// --- Initial Setup ---
function initialize() {
    // Event Listeners
    applicationForm.addEventListener('submit', handleApplicationSubmit);
    loginForm.addEventListener('submit', handleAdminLogin);
    adminLoginLink.addEventListener('click', () => navigateTo('login'));
    applicantViewLink.addEventListener('click', () => navigateTo('applicant'));
    logoutButton.addEventListener('click', handleLogout);

    // Initial load
    loadApplications();
    checkLoginStatus();

    if (state.isLoggedIn) {
        navigateTo('admin');
    } else {
        navigateTo('applicant');
    }
}

initialize();

document.addEventListener('DOMContentLoaded', () => {
    // DOM References for all pages
    const splashScreen = document.getElementById('splash-screen');
    const userSelectPage = document.getElementById('user-select-page'); // NEW PAGE
    const loginPage = document.getElementById('login-page');
    const signupPage = document.getElementById('signup-page');

    // Button/Link Elements
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const backToLoginLink = document.getElementById('backToLogin');

    /* CORE NAVIGATION LOGIC: Manages which page is visible (SPA simulation) */
    function navigateToPage(pageToShow, pagesToHide = []) {
        // Hide all previous sections
        pagesToHide.forEach(page => {
            page.classList.remove('active-page');
            page.classList.add('hidden-page');
        });

        // Show the target section
        pageToShow.classList.remove('hidden-page');
        pageToShow.classList.add('active-page');
    }


    // --- EVENT LISTENERS (Navigation) ---

    loginBtn.addEventListener('click', () => {
        console.log("Navigating to User Selection...");
        // FLOW CHANGE: Splash -> User Select Page
        navigateToPage(userSelectPage, [splashScreen]);
    });

    signupBtn.addEventListener('click', () => {
        console.log("Navigating to Signup...");
        navigateToPage(signupPage, [splashScreen]);
    });


    // --- ROLE SELECTION HANDLERS (NEW) ---
    const roleSelectors = document.querySelectorAll('.role-btn');
    roleSelectors.forEach(button => {
        button.addEventListener('click', () => {
            const role = button.getAttribute('data-role').toUpperCase();
            alert(`Successfully selected ${role} role! Proceeding to the Dashboard...`); 
            console.log(`User selected ${role}. Simulating successful login.`);
            // Here you would navigate to the dashboard page in a real app.
        });
    });


    // --- BACK LINK (Unchanged) ---
    if (backToLoginLink) {
         backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault(); 
            navigateToPage(loginPage, [splashScreen, signupPage]); 
        });
    }


    // --- FORM SUBMISSION HANDLERS (Unchanged) ---
    const loginForm = document.querySelector('#login-page form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            alert("Login successful! Redirecting to Dashboard...");
        });
    }

    const signupForm = document.querySelector('#signup-page form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            alert("Registration successful! Check your email for verification.");
        });
    }
});
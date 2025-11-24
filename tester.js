// Configuration
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const FACEBOOK_APP_ID = 'YOUR_FACEBOOK_APP_ID';

let currentUser = null;
let googleTokenClient;

// Initialize authentication services
function initializeAuth() {
    initializeGoogleAuth();
    initializeFacebookSDK();
    
    // Check if user was previously logged in
    checkExistingSession();
}

// Google OAuth Initialization
function initializeGoogleAuth() {
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true
        });
    }
}

// Facebook SDK Initialization
function initializeFacebookSDK() {
    window.fbAsyncInit = function() {
        FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
        });
        
        // Check Facebook login status after SDK loads
        FB.getLoginStatus(function(response) {
            if (response.status === 'connected') {
                // User is logged in with Facebook
                fetchFacebookUserInfo();
            }
        });
    };

    // Load Facebook SDK
    (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
}

// Handle Google OAuth Response
function handleGoogleResponse(response) {
    showLoading(true);
    
    try {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        
        currentUser = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
            loginMethod: 'Google'
        };
        
        // Save to localStorage to persist session
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showWelcomePage();
        showNotification(`Welcome back, ${payload.name}!`, 'success');
        
    } catch (error) {
        console.error('Google login error:', error);
        showNotification('Google login failed. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle Google Login
function handleGoogleLogin() {
    showLoading(true);
    
    googleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
                fetchGoogleUserInfo(tokenResponse.access_token);
            } else {
                showLoading(false);
                showNotification('Google login cancelled.', 'error');
            }
        },
    });
    googleTokenClient.requestAccessToken();
}

// Fetch Google User Info
function fetchGoogleUserInfo(accessToken) {
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(userInfo => {
        currentUser = {
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture,
            loginMethod: 'Google'
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showWelcomePage();
        showNotification('Google login successful!', 'success');
    })
    .catch(error => {
        console.error('Error fetching Google user info:', error);
        showNotification('Google login failed.', 'error');
    })
    .finally(() => {
        showLoading(false);
    });
}

// Handle Facebook Login
function handleFacebookLogin() {
    showLoading(true);
    
    FB.login(function(response) {
        if (response.authResponse) {
            // User granted permissions
            fetchFacebookUserInfo();
        } else {
            // User cancelled login or did not fully authorize
            showLoading(false);
            showNotification('Facebook login cancelled.', 'error');
        }
    }, { scope: 'public_profile,email' });
}

// Fetch Facebook User Info
function fetchFacebookUserInfo() {
    FB.api('/me', { fields: 'name,email,picture' }, function(userInfo) {
        currentUser = {
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture?.data?.url || '',
            loginMethod: 'Facebook'
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showWelcomePage();
        showNotification('Facebook login successful!', 'success');
        showLoading(false);
    });
}

// Handle Manual Login (Demo)
function handleManualLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    showLoading(true);
    
    // Simulate API call
    setTimeout(() => {
        currentUser = {
            name: email.split('@')[0],
            email: email,
            picture: '',
            loginMethod: 'Email'
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showWelcomePage();
        showNotification('Login successful!', 'success');
        showLoading(false);
    }, 1500);
}

// Show Welcome Page (Only after successful login)
function showWelcomePage() {
    if (!currentUser) {
        console.error('No user data available');
        return;
    }
    
    // Update user info in welcome page
    document.getElementById('welcome-user-name').textContent = currentUser.name;
    document.getElementById('nav-user-name').textContent = currentUser.name;
    
    if (currentUser.picture) {
        document.getElementById('welcome-user-pic').src = currentUser.picture;
        document.getElementById('nav-user-pic').src = currentUser.picture;
    } else {
        // Use default avatar if no picture
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=4285f4&color=fff`;
        document.getElementById('welcome-user-pic').src = defaultAvatar;
        document.getElementById('nav-user-pic').src = defaultAvatar;
    }
    
    document.getElementById('login-method-badge').textContent = currentUser.loginMethod;
    
    // Switch pages - hide login, show welcome
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('login-page').classList.add('hidden');
    
    document.getElementById('welcome-page').classList.remove('hidden');
    document.getElementById('welcome-page').classList.add('active');
    
    // Update page title
    document.title = `Welcome ${currentUser.name} - MyApp`;
}

// Handle Logout
function handleLogout() {
    // Clear user data
    currentUser = null;
    localStorage.removeItem('currentUser');
    
    // Clear form fields
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    
    // Switch back to login page
    document.getElementById('welcome-page').classList.remove('active');
    document.getElementById('welcome-page').classList.add('hidden');
    
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('login-page').classList.add('active');
    
    // Reset page title
    document.title = 'Login Page';
    
    // Revoke Google token if exists
    if (googleTokenClient) {
        google.accounts.oauth2.revoke('', () => {
            console.log('Google token revoked');
        });
    }
    
    // Facebook logout
    if (typeof FB !== 'undefined') {
        FB.logout(function(response) {
            console.log('Facebook logout successful');
        });
    }
    
    showNotification('Logged out successfully', 'success');
}

// Check if user is already logged in (on page load)
function checkExistingSession() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showWelcomePage();
            console.log('User automatically logged in from session');
        } catch (error) {
            console.error('Error parsing saved user data:', error);
            localStorage.removeItem('currentUser');
        }
    }
}

// Show Loading Spinner
function showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (show) {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

// Show Notification
function showNotification(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    
    // Insert in current active page
    const currentPage = document.querySelector('.page.active');
    if (currentPage.id === 'login-page') {
        const loginCard = currentPage.querySelector('.login-card');
        loginCard.insertBefore(messageEl, loginCard.querySelector('.form-group'));
    } else {
        const welcomeCard = currentPage.querySelector('.welcome-card');
        const welcomeContent = welcomeCard.querySelector('.welcome-content');
        welcomeCard.insertBefore(messageEl, welcomeContent);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 5000);
}

// Demo function for action buttons
function showNotification(message) {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'message success';
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '1000';
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 3000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});
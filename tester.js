// Simple authentication JavaScript - easy to understand!

// Store users in localStorage (for demo purposes)
function getUsers() {
  const users = localStorage.getItem('users');
  if (!users) return {};

  // Parse and normalize keys to lowercase (handles older saved entries)
  try {
    const parsed = JSON.parse(users);
    const normalized = {};
    let changed = false;
    for (const k in parsed) {
      const user = parsed[k] || {};
      const keyLower = (user.email || k).toLowerCase();
      user.email = keyLower;
      normalized[keyLower] = user;
      if (keyLower !== k) changed = true;
    }
    if (changed) {
      localStorage.setItem('users', JSON.stringify(normalized));
    }
    return normalized;
  } catch (err) {
    // Malformed data - clear it
    localStorage.removeItem('users');
    return {};
  }
}

function saveUser(user) {
  const users = getUsers();
  // Ensure email key is normalized to lowercase
  const emailKey = (user.email || '').toLowerCase();
  user.email = emailKey;
  users[emailKey] = user;
  localStorage.setItem('users', JSON.stringify(users));
}

// Switch between views (signin, signup, forgot)
function switchView(viewName) {
  // Hide all views
  const views = document.querySelectorAll('.view');
  views.forEach(view => view.classList.remove('active'));
  
  // Show the selected view
  const targetView = document.getElementById(viewName + 'View');
  if (targetView) {
    targetView.classList.add('active');
  }
  
  // Clear any error messages
  clearErrors();
}

// Show toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Clear all error messages
function clearErrors() {
  const errorTexts = document.querySelectorAll('.error-text');
  errorTexts.forEach(error => error.textContent = '');
  
  const errorBox = document.getElementById('errorBox');
  if (errorBox) errorBox.style.display = 'none';
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// SIGN IN FORM
document.getElementById('signinForm').addEventListener('submit', function(e) {
  e.preventDefault();
  clearErrors();
  
  const emailRaw = document.getElementById('signinEmail').value.trim();
  const email = emailRaw.toLowerCase();
  const password = document.getElementById('signinPassword').value;
  const remember = document.getElementById('rememberMe').checked;
  
  // Validate inputs
  if (!email || !password) {
    showToast('Please fill in all fields');
    return;
  }
  
  if (!isValidEmail(email)) {
    showToast('Please enter a valid email');
    return;
  }
  
  // Check if user exists and password matches
  const users = getUsers();
  const user = users[email];
  
  if (user && user.password === password) {
    // Save to localStorage if remember me is checked
    if (remember) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    
    // Save current user session
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    showToast('Signed in successfully!');
    
    // Redirect to welcome page
    setTimeout(() => {
      window.location.href = 'welcome.html';
    }, 500);
  } else {
    // Show error
    const errorBox = document.getElementById('errorBox');
    if (errorBox) errorBox.style.display = 'flex';
  }
});

// SIGN UP FORM
document.getElementById('signupForm').addEventListener('submit', function(e) {
  e.preventDefault();
  clearErrors();
  
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const emailRaw = document.getElementById('signupEmail').value.trim();
  const email = emailRaw.toLowerCase();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  let hasError = false;
  
  // Validate first name
  if (!firstName) {
    document.getElementById('errorFirstName').textContent = 'First name is required';
    hasError = true;
  }
  
  // Validate last name
  if (!lastName) {
    document.getElementById('errorLastName').textContent = 'Last name is required';
    hasError = true;
  }
  
  // Validate email
  if (!email) {
    document.getElementById('errorEmail').textContent = 'Email is required';
    hasError = true;
  } else if (!isValidEmail(email)) {
    document.getElementById('errorEmail').textContent = 'Please enter a valid email';
    hasError = true;
  }
  
  // Validate password
  if (password.length < 6) {
    document.getElementById('errorPassword').textContent = 'Password must be at least 6 characters';
    hasError = true;
  }
  
  // Validate confirm password
  if (password !== confirmPassword) {
    document.getElementById('errorConfirm').textContent = 'Passwords do not match';
    hasError = true;
  }
  
  if (hasError) return;
  
  // Check if email already exists (case-insensitive)
  const users = getUsers();
  if (users[email]) {
    document.getElementById('errorEmail').textContent = 'This email is already registered';
    return;
  }
  
  // Create new user (normalize email)
  const newUser = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password
  };
  
  saveUser(newUser);
  
  // Save current user session
  localStorage.setItem('currentUser', JSON.stringify(newUser));
  
  showToast('Account created successfully! You can now sign in.');
  
  // After successful sign up, switch back to sign in view and pre-fill the email
  setTimeout(() => {
    switchView('signin');
    document.getElementById('signinEmail').value = newUser.email;
    document.getElementById('signinPassword').value = '';
  }, 800);
});

// FORGOT PASSWORD FORM
document.getElementById('forgotForm').addEventListener('submit', function(e) {
  e.preventDefault();
  clearErrors();
  
  const emailRaw = document.getElementById('forgotEmail').value.trim();
  const email = emailRaw.toLowerCase();
  
  if (!email) {
    document.getElementById('errorForgot').textContent = 'Please enter your email';
    return;
  }
  
  if (!isValidEmail(email)) {
    document.getElementById('errorForgot').textContent = 'Please enter a valid email';
    return;
  }
  
  showToast('Password reset instructions sent to your email!');
  
  // Switch to sign in after 1.5 seconds
  setTimeout(() => {
    switchView('signin');
    // Pre-fill email
    document.getElementById('signinEmail').value = email;
  }, 1500);
});

// Social login (functional - redirects to welcome page)
function socialLogin(provider) {
  // Create a user session for social login
  const socialUser = {
    firstName: provider,
    lastName: 'User',
    email: provider.toLowerCase() + '@example.com',
    password: 'social-login-' + Date.now()
  };
  
  saveUser(socialUser);
  
  // Save current user session
  localStorage.setItem('currentUser', JSON.stringify(socialUser));
  
  showToast('Signed in with ' + provider + '!');
  
  // Redirect to welcome page
  setTimeout(() => {
    window.location.href = 'welcome.html';
  }, 800);
}

// Load remembered email and create demo account on page load
window.addEventListener('load', function() {
  // Create demo account if it doesn't exist
  const users = getUsers();
  if (!users['demo@example.com']) {
    saveUser({
      firstName: 'Demo',
      lastName: 'User',
      email: 'demo@example.com',
      password: 'demo123'
    });
  }
  
  // Load remembered email
  const rememberedEmail = localStorage.getItem('rememberedEmail');
  if (rememberedEmail) {
    document.getElementById('signinEmail').value = rememberedEmail;
    document.getElementById('rememberMe').checked = true;
  }
});

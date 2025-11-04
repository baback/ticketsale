// Check if user is already logged in and redirect
async function checkAuthAndRedirect() {
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            // Check for redirect parameter
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect');
            
            if (redirect) {
                window.location.href = redirect;
            } else {
                window.location.href = '/dashboard/';
            }
        }
    } catch (error) {
        console.error('Error checking auth:', error);
    }
}

// Run auth check
checkAuthAndRedirect();

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', 'dark');
    html.classList.add('dark');
}

if (localStorage.getItem('theme') === 'dark') {
    html.classList.add('dark');
} else {
    html.classList.remove('dark');
}

themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    const theme = html.classList.contains('dark') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
});

// Tab switching
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const backToLoginBtn = document.getElementById('backToLoginBtn');
const messageDiv = document.getElementById('message');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

loginTab.addEventListener('click', () => {
    loginTab.classList.add('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
    loginTab.classList.remove('text-neutral-600', 'dark:text-neutral-400');
    signupTab.classList.remove('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
    signupTab.classList.add('text-neutral-600', 'dark:text-neutral-400');
    
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    forgotPasswordForm.classList.add('hidden');
    pageTitle.textContent = 'Welcome Back';
    pageSubtitle.textContent = 'Sign in to access your tickets';
    hideMessage();
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
    signupTab.classList.remove('text-neutral-600', 'dark:text-neutral-400');
    loginTab.classList.remove('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
    loginTab.classList.add('text-neutral-600', 'dark:text-neutral-400');
    
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    forgotPasswordForm.classList.add('hidden');
    pageTitle.textContent = 'Create Account';
    pageSubtitle.textContent = 'Join ticketsale.ca today';
    hideMessage();
});

forgotPasswordBtn.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    signupForm.classList.add('hidden');
    forgotPasswordForm.classList.remove('hidden');
    pageTitle.textContent = 'Reset Password';
    pageSubtitle.textContent = 'Enter your email to receive a reset link';
    hideMessage();
});

backToLoginBtn.addEventListener('click', () => {
    forgotPasswordForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    pageTitle.textContent = 'Welcome Back';
    pageSubtitle.textContent = 'Sign in to access your tickets';
    hideMessage();
});

// Message helpers
function showMessage(text, isError = false) {
    messageDiv.textContent = text;
    messageDiv.classList.remove('hidden');
    if (isError) {
        messageDiv.classList.add('bg-red-100', 'dark:bg-red-900/20', 'text-red-600', 'dark:text-red-400');
        messageDiv.classList.remove('bg-green-100', 'dark:bg-green-900/20', 'text-green-600', 'dark:text-green-400');
    } else {
        messageDiv.classList.add('bg-green-100', 'dark:bg-green-900/20', 'text-green-600', 'dark:text-green-400');
        messageDiv.classList.remove('bg-red-100', 'dark:bg-red-900/20', 'text-red-600', 'dark:text-red-400');
    }
}

function hideMessage() {
    messageDiv.classList.add('hidden');
}

// Single login page for all users

// Login handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        showMessage('Login successful! Redirecting...');
        
        // Check for redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        
        // Redirect after short delay
        setTimeout(() => {
            if (redirect) {
                window.location.href = redirect;
            } else {
                window.location.href = '/dashboard/';
            }
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage(error.message || 'Login failed. Please check your credentials.', true);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});

// Signup handler
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';
    
    try {
        // Sign up the user (trigger will automatically create user profile)
        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) throw error;
        
        showMessage('Account created successfully! Please check your email to confirm your account.');
        
        // Redirect to confirmation page
        setTimeout(() => {
            window.location.href = '/login/confirm/';
        }, 1500);
        
    } catch (error) {
        console.error('Signup error:', error);
        showMessage(error.message || 'Signup failed. Please try again.', true);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
    }
});

// Testimonials rotation - Mixed audience (buyers and organizers)
const testimonials = [
    {
        text: "ticketsale.ca made selling out our venue effortless. The platform is intuitive and our fans love it.",
        author: "Sarah Chen",
        role: "Event Organizer",
        image: "https://i.pravatar.cc/150?img=5"
    },
    {
        text: "Best ticketing experience I've had. Clean interface, fast checkout, and my tickets were instantly available.",
        author: "Marcus Johnson",
        role: "Concert Enthusiast",
        image: "https://i.pravatar.cc/150?img=12"
    },
    {
        text: "We switched to ticketsale.ca and saw a 40% increase in ticket sales. The analytics are game-changing.",
        author: "Alex Rivera",
        role: "Festival Director",
        image: "https://i.pravatar.cc/150?img=14"
    },
    {
        text: "Finally, a ticketing platform that doesn't take a huge cut. More money stays with us, and attendees appreciate the fair pricing.",
        author: "Jordan Lee",
        role: "Music Venue Owner",
        image: "https://i.pravatar.cc/150?img=60"
    },
    {
        text: "I love how easy it is to find events and buy tickets. No hidden fees, just straightforward pricing.",
        author: "Emily Rodriguez",
        role: "Theater Fan",
        image: "https://i.pravatar.cc/150?img=47"
    },
    {
        text: "The mobile experience is fantastic. Got my tickets in seconds and the QR code worked perfectly at the venue.",
        author: "David Kim",
        role: "Sports Fan",
        image: "https://i.pravatar.cc/150?img=33"
    }
];

let currentTestimonial = 0;

function rotateTestimonials() {
    const container = document.getElementById('testimonials');
    if (!container) return;
    
    const testimonial = testimonials[currentTestimonial];
    container.innerHTML = `
        <div class="space-y-6 fade-in">
            <svg class="w-12 h-12 text-neutral-400 dark:text-neutral-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
            </svg>
            <p class="text-xl md:text-2xl font-medium leading-relaxed">
                "${testimonial.text}"
            </p>
            <div class="flex items-center gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <img src="${testimonial.image}" alt="${testimonial.author}" class="w-14 h-14 rounded-full border-2 border-neutral-200 dark:border-neutral-800 shadow-lg" />
                <div>
                    <div class="font-semibold text-lg">${testimonial.author}</div>
                    <div class="text-sm text-neutral-600 dark:text-neutral-400">${testimonial.role}</div>
                </div>
            </div>
        </div>
    `;
    
    currentTestimonial = (currentTestimonial + 1) % testimonials.length;
}

// Forgot password handler
forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessage();
    
    const email = document.getElementById('resetEmail').value;
    
    const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    
    try {
        // Use current origin for redirect (works for both localhost and production)
        const redirectUrl = `${window.location.origin}/login/reset-password/`;
        console.log('Reset redirect URL:', redirectUrl);
        
        // Show immediate feedback
        showMessage('Sending reset link... This may take a few seconds.', false);
        
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl
        });
        
        if (error) throw error;
        
        showMessage('✓ Password reset link sent! Check your email (including spam folder).');
        
        // Clear form and go back to login after delay
        setTimeout(() => {
            document.getElementById('resetEmail').value = '';
            backToLoginBtn.click();
        }, 4000);
        
    } catch (error) {
        console.error('Password reset error:', error);
        
        // Handle rate limit error specifically
        if (error.message && error.message.includes('rate limit')) {
            showMessage('Too many requests. Please wait a few minutes and try again.', true);
        } else {
            showMessage(error.message || 'Failed to send reset link. Please try again.', true);
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Reset Link';
    }
});

// Initialize testimonials
rotateTestimonials();
setInterval(rotateTestimonials, 5000);

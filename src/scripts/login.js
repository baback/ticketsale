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
const messageDiv = document.getElementById('message');

loginTab.addEventListener('click', () => {
    loginTab.classList.add('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
    loginTab.classList.remove('text-neutral-600', 'dark:text-neutral-400');
    signupTab.classList.remove('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
    signupTab.classList.add('text-neutral-600', 'dark:text-neutral-400');
    
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    hideMessage();
});

signupTab.addEventListener('click', () => {
    signupTab.classList.add('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
    signupTab.classList.remove('text-neutral-600', 'dark:text-neutral-400');
    loginTab.classList.remove('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black');
    loginTab.classList.add('text-neutral-600', 'dark:text-neutral-400');
    
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
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
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = '/dashboard/';
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
        
        showMessage('Account created successfully! Redirecting...');
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = '/dashboard/';
        }, 1000);
        
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

// Initialize testimonials
rotateTestimonials();
setInterval(rotateTestimonials, 5000);

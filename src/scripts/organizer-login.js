// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Set dark mode as default
if (!localStorage.getItem('theme')) {
    localStorage.setItem('theme', 'dark');
    html.classList.add('dark');
}

// Load saved theme
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

// Testimonials data for organizers
const testimonials = [
    {
        quote: "Sold out our venue in 3 hours. The analytics dashboard helped us understand our audience like never before.",
        author: "Alex Rivera",
        role: "Music Venue Owner"
    },
    {
        quote: "We've hosted 50+ events on ticketsale. The platform just works, and our attendees love the experience.",
        author: "Jordan Lee",
        role: "Festival Organizer"
    },
    {
        quote: "Finally, a ticketing platform that doesn't take a huge cut. More money stays with us and our artists.",
        author: "Taylor Morgan",
        role: "Concert Promoter"
    },
    {
        quote: "The real-time sales tracking is incredible. I can monitor everything from my phone while setting up the venue.",
        author: "Casey Williams",
        role: "Event Producer"
    },
    {
        quote: "Customer support is amazing. They helped us customize everything for our unique event needs.",
        author: "Sam Patel",
        role: "Conference Organizer"
    }
];

// Testimonial rotation
let currentTestimonial = 0;
const testimonialContainer = document.getElementById('testimonials');

function renderTestimonial(index) {
    const testimonial = testimonials[index];
    testimonialContainer.innerHTML = `
        <div class="testimonial-content space-y-6 animate-fade-in">
            <svg class="w-12 h-12 text-black/20 dark:text-white/20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
            </svg>
            <p class="text-2xl md:text-3xl font-medium leading-relaxed">
                "${testimonial.quote}"
            </p>
            <div class="space-y-1">
                <p class="font-bold text-lg">${testimonial.author}</p>
                <p class="text-neutral-600 dark:text-neutral-400">${testimonial.role}</p>
            </div>
        </div>
    `;
}

function rotateTestimonials() {
    testimonialContainer.style.opacity = '0';
    
    setTimeout(() => {
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        renderTestimonial(currentTestimonial);
        testimonialContainer.style.opacity = '1';
    }, 500);
}

// Initialize testimonials
if (testimonialContainer) {
    testimonialContainer.style.transition = 'opacity 0.5s ease-in-out';
    renderTestimonial(0);
    setInterval(rotateTestimonials, 5000);
}

// Form handling
const emailForm = document.getElementById('emailForm');
const otpForm = document.getElementById('otpForm');
const emailInput = document.getElementById('email');
const otpInput = document.getElementById('otp');
const emailDisplay = document.getElementById('emailDisplay');
const backBtn = document.getElementById('backBtn');

emailForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    
    // Simulate sending OTP
    console.log('Sending OTP to:', email);
    
    // Show OTP form
    emailForm.classList.add('hidden');
    otpForm.classList.remove('hidden');
    emailDisplay.textContent = email;
    
    // Focus on OTP input
    setTimeout(() => otpInput.focus(), 100);
});

otpForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const otp = otpInput.value;
    
    // Simulate OTP verification
    console.log('Verifying OTP:', otp);
    
    // Redirect to organizer dashboard (you can change this)
    alert('Login successful! Redirecting to organizer dashboard...');
    window.location.href = '/organizer/';
});

backBtn.addEventListener('click', () => {
    otpForm.classList.add('hidden');
    emailForm.classList.remove('hidden');
    otpInput.value = '';
});

// Auto-format OTP input (numbers only)
otpInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
});

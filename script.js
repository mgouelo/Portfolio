const toggleBtn = document.getElementById('toggleBtn');

// Verify if a color mode is already saved in localStorage
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    toggleBtn.title = 'Light Mode';
} else {
    toggleBtn.title = 'Dark Mode';
}

// By clicking, change color mode and save preference
toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        toggleBtn.title = 'Dark Mode';
    } else {
        localStorage.setItem('theme', 'light');
        toggleBtn.title = 'Light Mode';
    }
});
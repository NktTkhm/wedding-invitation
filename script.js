document.addEventListener('DOMContentLoaded', () => {
    // --- Device Type Detection (Show QR on Desktop) ---
    const mainContent = document.getElementById('main-content');
    const qrOverlay = document.getElementById('desktop-qr-overlay');

    // Check if the primary input method is a mouse
    // Use try-catch for older browsers that might not support matchMedia or 'pointer'
    try {
        if (window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
            // Likely a desktop/laptop with a mouse
            if (mainContent) mainContent.style.display = 'none';
            if (qrOverlay) qrOverlay.style.display = 'flex'; // Use flex to keep centering
        } else {
            // Likely a touch device (or fine pointer not detected)
            // Ensure defaults are set (might be redundant if CSS defaults are correct)
             if (mainContent) mainContent.style.display = 'block';
             if (qrOverlay) qrOverlay.style.display = 'none';
        }
    } catch (e) {
        console.warn("Could not determine pointer type, showing default content.", e);
        // Fallback: Ensure defaults are set if detection fails
        if (mainContent) mainContent.style.display = 'block';
        if (qrOverlay) qrOverlay.style.display = 'none';
    }
    // --- End Device Type Detection ---

    // Intersection Observer for fade-up animation
    const observerOptions = {
        threshold: 0.2 // Trigger when 20% of the element is visible
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Stop observing once visible
            }
        });
    };

    const io = new IntersectionObserver(observerCallback, observerOptions);
    document.querySelectorAll('.fade-up').forEach(el => io.observe(el));

    // Set current year in footer
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    // RSVP Form handling
    const form = document.getElementById('rsvp-form');
    const formStatus = document.getElementById('form-status');

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            formStatus.textContent = 'Отправка...';
            formStatus.style.color = '#333'; // Reset color
            const submitButton = form.querySelector('.submit-button');
            submitButton.disabled = true; // Disable button during sending

            // Collect form data
            const formData = new FormData(form);
            const data = {
                guestName: formData.get('guestName'),
                attendance: formData.get('attendance'),
                // Get all checked drink preferences
                drinks: Array.from(formData.getAll('drinks'))
            };

            try {
                // Send data to the Netlify function
                const response = await fetch('/.netlify/functions/telegram-sender', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    const result = await response.json();
                    formStatus.textContent = 'Спасибо, ваш ответ отправлен!';
                    formStatus.style.color = 'green';
                    form.reset(); // Clear the form
                } else {
                    // Try to get error message from response body
                    let errorMessage = `Ошибка отправки (${response.status})`;
                    try {
                         const errorResult = await response.json();
                         if(errorResult.error) errorMessage += `: ${errorResult.error}`;
                    } catch (e) {
                         // Ignore if response body is not JSON or empty
                    }
                     formStatus.textContent = errorMessage;
                     formStatus.style.color = 'red';
                }
            } catch (error) {
                console.error('Form submission error:', error);
                formStatus.textContent = 'Ошибка сети при отправке.';
                formStatus.style.color = 'red';
            } finally {
                 submitButton.disabled = false; // Re-enable button
            }
        });
    }

    // --- Music Toggle Button --- 
    const music = document.getElementById('bg-music');
    const toggleButton = document.getElementById('music-toggle-button');

    if (music && toggleButton) {
        // Check if audio is ready before adding listener
        const setupMusicControls = () => {
            toggleButton.addEventListener('click', () => {
                if (music.paused) {
                    // Attempt to play
                    music.play().then(() => {
                        // Success
                        toggleButton.textContent = '⏸️'; // Pause icon
                    }).catch(error => {
                        console.error("Music play failed:", error);
                        // Optionally notify user that interaction is needed
                        // alert("Не удалось включить музыку автоматически. Нажмите кнопку еще раз."); 
                    });
                } else {
                    music.pause();
                    toggleButton.textContent = '🎵'; // Play icon
                }
            });

            // Update button icon based on actual audio state
            music.onpause = () => { toggleButton.textContent = '🎵'; };
            music.onplaying = () => { toggleButton.textContent = '⏸️'; }; // Use onplaying for more reliability
            music.onended = () => { toggleButton.textContent = '🎵'; }; // Handle if loop is off or fails
        };

        // Check if audio metadata is loaded, or wait for it
        if (music.readyState >= 2) { // HAVE_CURRENT_DATA or more
             setupMusicControls();
        } else {
             music.addEventListener('canplay', setupMusicControls, { once: true });
        }
    }
    // --- End Music Toggle Button ---

}); // End of DOMContentLoaded 
document.addEventListener('DOMContentLoaded', () => {
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
}); 
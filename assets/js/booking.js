// Client-side booking form handling
// Requires booking.html to include: <script src="/assets/js/booking.js" defer></script>

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('bookingForm');
  const submitBtn = document.getElementById('submitBtn');
  const messageEl = document.getElementById('formMessage');

  function showMessage(text, isError=false) {
    messageEl.textContent = text;
    messageEl.style.color = isError ? '#d9534f' : '#28a745';
  }

  function validateDates(checkin, checkout) {
    if (!checkin || !checkout) return false;
    const inDate = new Date(checkin);
    const outDate = new Date(checkout);
    return inDate < outDate;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    messageEl.textContent = '';

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      checkin: form.checkin.value,
      checkout: form.checkout.value,
      roomType: form.roomType.value,
      guests: parseInt(form.guests.value || '1', 10),
      message: form.message.value.trim()
    };

    // Basic client-side validation
    if (!data.name || !data.email || !data.checkin || !data.checkout) {
      showMessage('Please fill in required fields (name, email, check-in and check-out).', true);
      return;
    }

    if (!validateDates(data.checkin, data.checkout)) {
      showMessage('Check-out date must be after check-in date.', true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    // Primary endpoint for serverless: prefer /api/booking (Vercel) or /.netlify/functions/booking
    const endpoints = ['/api/booking', '/.netlify/functions/booking'];
    let res = null;
    let lastErr = null;

    for (const url of endpoints) {
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (res && res.ok) break;
        const text = await res.text().catch(()=>null);
        lastErr = `Endpoint ${url} returned ${res.status}${text? ' — ' + text : ''}`;
      } catch (err) {
        lastErr = `Network error to ${url}: ${err.message}`;
      }
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Request booking';

    if (!res) {
      showMessage('Failed to submit booking. ' + lastErr, true);
      return;
    }

    if (res.ok) {
      showMessage('Booking request sent. We will contact you shortly.');
      form.reset();
    } else {
      const body = await res.json().catch(()=>({message: 'Unknown error'}));
      showMessage(body.message || 'Submission failed.', true);
    }
  });
});

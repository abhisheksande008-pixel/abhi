// Example Netlify Function: functions/booking.js
// Deploy on Netlify (Node 18+). Requires environment variables:
//   SENDGRID_API_KEY - your SendGrid API key
//   TO_EMAIL - recipient email where booking notifications are sent
//   (optional) FROM_EMAIL
//
// This example uses the SendGrid HTTP API via global fetch (Node 18+).
// Replace with your preferred mail provider or store the booking in a database.

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
    }

    const payload = JSON.parse(event.body || '{}');

    // Basic validation
    if (!payload.name || !payload.email || !payload.checkin || !payload.checkout) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing required fields' }) };
    }

    // Validate dates
    if (new Date(payload.checkin) >= new Date(payload.checkout)) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Check-out must be after check-in' }) };
    }

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const TO_EMAIL = process.env.TO_EMAIL;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@examplehotel.com';

    if (!SENDGRID_API_KEY || !TO_EMAIL) {
      // In production you MUST configure API keys
      return { statusCode: 500, body: JSON.stringify({ message: 'Server not configured' }) };
    }

    // Construct email content
    const emailBody = `\nNew booking request\n\nName: ${payload.name}\nEmail: ${payload.email}\nPhone: ${payload.phone || 'N/A'}\nCheck-in: ${payload.checkin}\nCheck-out: ${payload.checkout}\nRoom: ${payload.roomType}\nGuests: ${payload.guests}\nMessage: ${payload.message || 'N/A'}\n`;

    // Send via SendGrid API
    const sendRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: TO_EMAIL }] }],
        from: { email: FROM_EMAIL },
        subject: `Booking request: ${payload.name} (${payload.checkin} → ${payload.checkout})`,
        content: [{ type: 'text/plain', value: emailBody }]
      })
    });

    if (!sendRes.ok) {
      const txt = await sendRes.text().catch(()=>'<no body>');
      return { statusCode: 502, body: JSON.stringify({ message: 'Failed to send email', detail: txt }) };
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Booking request sent' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Server error', error: err.message }) };
  }
};

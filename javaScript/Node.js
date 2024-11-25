const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const RECAPTCHA_SECRET_KEY = '6LcM-4kqAAAAADMEhmAxcnM5Y4wvGCiRVepv573x';

app.post('/submit-create-account', async (req, res) => {
    const { username, email, password, 'g-recaptcha-response': captchaResponse } = req.body;

    if (!captchaResponse) {
        return res.status(400).send('Please complete the CAPTCHA.');
    }

    // Verify reCAPTCHA
    const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaResponse}`;
    const response = await fetch(verifyURL, { method: 'POST' });
    const captchaResult = await response.json();

    if (!captchaResult.success) {
        return res.status(400).send('Failed CAPTCHA verification. Please try again.');
    }

    // Process user registration (e.g., save to database)
    // ...

    res.status(200).send('Account created successfully!');
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));

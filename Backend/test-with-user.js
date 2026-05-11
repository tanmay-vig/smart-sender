// Test script to login and send email with real user credentials
const axios = require('axios');
const FormData = require('form-data');

const testWithRealUser = async () => {
  try {
    // Step 1: Login with real user credentials
    console.log('🔐 Logging in with user credentials...');
    const loginData = {
      email: 'nemogpt.dev@gmail.com',
      password: 'Inemo@9634'
    };

    const loginResponse = await axios.post('http://localhost:8102/api/userlogin', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login response:', loginResponse.data);
    
    // Step 2: Set up profile with app password (you'll need to provide this)
    console.log('📝 Setting up user profile...');
    const profileData = {
      email: 'nemogpt.dev@gmail.com',
      name: 'Nemo GPT',
      contact: '1234567890',
      linkedIn: 'https://linkedin.com/in/nemogpt',
      appPassword: 'YOUR_GMAIL_APP_PASSWORD_HERE' // You need to replace this
    };

    const profileResponse = await axios.post('http://localhost:8102/api/userlogin/profile', profileData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Profile setup response:', profileResponse.data);
    
    // Step 3: Send a test email
    console.log('📧 Sending test email...');
    const formData = new FormData();
    formData.append('fromEmail', 'nemogpt.dev@gmail.com');
    formData.append('user', 'Nemo GPT');
    formData.append('xlsxData', JSON.stringify([
      {
        email: 'test@example.com',
        name: 'Test Recipient',
        company: 'Test Company'
      }
    ]));
    formData.append('subject', 'Test Email from SmartSender');
    formData.append('text', 'This is a test email to verify storage functionality');
    formData.append('contact', '1234567890');
    formData.append('linkenIn', 'https://linkedin.com/in/nemogpt');

    const sendResponse = await axios.post('http://localhost:8102/api/sendmail', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Email send response:', sendResponse.data);
    
    // Step 4: Check sent emails
    console.log('📊 Fetching sent emails...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const sentEmailsResponse = await axios.get('http://localhost:8102/api/sent-emails?fromEmail=nemogpt.dev@gmail.com');
    
    console.log('📊 Sent emails response:', JSON.stringify(sentEmailsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
};

console.log('🚀 Starting test with real user credentials...');
testWithRealUser();

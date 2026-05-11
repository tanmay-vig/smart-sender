// Test script to send an email and verify database storage
const axios = require('axios');
const FormData = require('form-data');

const testSendEmail = async () => {
  const formData = new FormData();
  formData.append('fromEmail', 'test@gmail.com');
  formData.append('user', 'Test User');
  formData.append('xlsxData', JSON.stringify([
    {
      email: 'recipient@example.com',
      name: 'Test Recipient',
      company: 'Test Company'
    }
  ]));
  formData.append('subject', 'Test Email Subject');
  formData.append('text', 'This is a test email');
  formData.append('contact', '1234567890');
  formData.append('linkenIn', 'https://linkedin.com/in/test');

  try {
    console.log('🚀 Sending test email...');
    const response = await axios.post('http://localhost:8102/api/sendmail', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Email sent response:', response.data);
    
    // Wait a bit for the database to be updated
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check sent emails
    console.log('📊 Fetching sent emails...');
    const sentEmailsResponse = await axios.get('http://localhost:8102/api/sent-emails?fromEmail=test@gmail.com');
    
    console.log('📊 Sent emails response:', JSON.stringify(sentEmailsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

testSendEmail();

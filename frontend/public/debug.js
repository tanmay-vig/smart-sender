// Debug script to check localStorage values
console.log("=== Frontend localStorage Debug ===");
console.log("userEmail:", localStorage.getItem('userEmail'));
console.log("userName:", localStorage.getItem('userName'));
console.log("contact:", localStorage.getItem('contact'));
console.log("linkedIn:", localStorage.getItem('linkedIn'));

// Also test the API call that the frontend makes
const testFrontendAPI = async () => {
  const userEmail = localStorage.getItem('userEmail');
  if (userEmail) {
    console.log(`Testing API call for: ${userEmail}`);
    try {
      const response = await fetch(`http://localhost:8102/api/sent-emails?fromEmail=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      console.log("API Response:", data);
    } catch (error) {
      console.error("API Error:", error);
    }
  } else {
    console.log("No userEmail in localStorage");
  }
};

testFrontendAPI();

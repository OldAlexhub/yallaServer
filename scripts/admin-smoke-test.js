import axios from 'axios';
import 'dotenv/config';

(async () => {
  try {
    const base = process.env.API_BASE || 'http://localhost:5000';
    const loginUrl = `${base}/admin/auth/login`;
    console.log('POST', loginUrl);

    const creds = {
      email: 'mohamedgad@yalla.local',
      password: '12345678',
    };

    const loginResp = await axios.post(loginUrl, creds, { headers: { 'Content-Type': 'application/json' } });
    console.log('Login status:', loginResp.status);
    const token = loginResp.data && loginResp.data.token;
    if (!token) {
      console.error('Login did not return a token:', loginResp.data);
      process.exit(1);
    }
    console.log('Received token (truncated):', token.slice(0, 32) + '...');

    // Fetch heat zones list
    const heatUrl = `${base}/admin/heat-zones`;
    console.log('GET', heatUrl);
    const listResp = await axios.get(heatUrl, { headers: { Authorization: `Bearer ${token}` } });
    console.log('Heat zones status:', listResp.status);
    console.log('Heat zones response:', JSON.stringify(listResp.data, null, 2));

    console.log('Smoke test completed successfully');
    process.exit(0);
  } catch (err) {
    if (err.response) {
      console.error('Request failed:', err.response.status, JSON.stringify(err.response.data));
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
})();

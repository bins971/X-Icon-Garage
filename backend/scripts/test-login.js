const axios = require('axios');

async function testLogin() {
    try {
        console.log('Attempting login...');
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            username: 'xicongarage',
            password: 'xicongarage12345'
        });
        console.log('Login Success:', res.status, res.data.token ? 'Token Received' : 'No Token');
    } catch (error) {
        if (error.response) {
            console.error('Login Failed:', error.response.status, error.response.data);
        } else {
            console.error('Network/Server Error:', error.message);
        }
    }
}

testLogin();

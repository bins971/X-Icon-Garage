const axios = require('axios');

async function testTrack() {
    try {
        console.log('Testing Track...');
        const res = await axios.post('http://localhost:5000/api/public/track', {
            jobNumber: 'JO-105748',
            plateNumber: 'asd 12324'
        });
        console.log('Track Params:', res.data);
    } catch (error) {
        console.error('Track Fail:', error.response?.data || error.message);
    }
}
testTrack();

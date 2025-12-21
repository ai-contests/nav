
import axios from 'axios';

async function verifyApi() {
    const endpoints = [
        'https://modelscope.cn/api/v1/competitions',
        'https://modelscope.cn/api/v1/competition/list',
        'https://modelscope.cn/api/v1/task/list',
    ];

    for (const url of endpoints) {
        try {
            console.log(`Testing ${url}...`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': 'https://modelscope.cn/'
                },
                validateStatus: null // log all statuses
            });
            console.log(`Status: ${response.status}`);
            console.log(`Content-Type: ${response.headers['content-type']}`);
            if (response.data && response.data.Data && response.data.Data.Races) {
                const firstRace = response.data.Data.Races[0];
                console.log('First Race Schema:', JSON.stringify(firstRace, null, 2));
            }
        } catch (e) {
            console.error(`Error fetching ${url}:`, e.message);
        }
        console.log('---');
    }
}

verifyApi();

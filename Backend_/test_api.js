const http = require('http');

const postData = JSON.stringify({
    name: "Test Student",
    email: "test" + Date.now() + "@example.com",
    age: 20,
    course: "CS101"
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/add-student',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        console.log('No more data in response.');
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();

// Also test root
http.get('http://localhost:5000/', (res) => {
    console.log('Root STATUS: ' + res.statusCode);
    res.on('data', (chunk) => {
        console.log(`Root BODY: ${chunk}`);
    });
});

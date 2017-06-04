const express = require('express');
const app = express();
const SERVER_PORT = process.env.PORT || 3000;

app.listen(SERVER_PORT, function () {
	console.log(`Express is listening on ${SERVER_PORT}`);
});


#!/usr/bin/env node

const path = require('path');
const express = require('express');
const app = express();
const CLIENT_PORT = process.env.PORT || 9000;

app.use(express.static('public'));

app.get('*', (req, res) => {
	res.sendFile(path.resolve(__dirname, '../public/index.html'));
});

app.listen(CLIENT_PORT, function () {
	console.log('Client express is listening on port', CLIENT_PORT);
});

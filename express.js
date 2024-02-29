const express = require('express');
const path = require('path');
var os = require("os");

const app = express();


app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '/'));

app.use(express.static(path.join(__dirname, "public")));


// Define a route to render an HTML file (for example)
app.get('/', (req, res) => {
  const networkInterfaces = os.networkInterfaces();

  const pageTitle = 'Express with EJS';
  const message = os.hostname();
  const ipv4Addresses = Object.values(networkInterfaces)
    .flatMap(interface => interface.filter(details => details.family === 'IPv4'))
    .map(details => details.address);

  res.render('index-2', { title: pageTitle, message: message, ipv4Addresses: ipv4Addresses });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Express server running on http://localhost:${port}`);
});

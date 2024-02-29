const express = require('express');
const path = require('path');
var os = require("os");
const { exec } = require('child_process');

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



app.get('/requestApplicationLogs', (req, res) => {
  const depth = req.query.depth || 100;
  const command = `Get-EventLog -LogName Application -EntryType Error  -Newest ${depth}  | Select EventID, InstanceId, TimeGenerated, Index, Message | ConvertTo-Json`;

  exec(`powershell.exe -Command "${command}"`, (error, stdout, stderr) => {
      if (error) {
          console.error(`Error executing PowerShell command: ${error.message}`);
          res.status(500).send('Internal Server Error');
          return;
      }
      if (stderr) {
          console.error(`PowerShell command encountered an error: ${stderr}`);
          res.status(500).send('Internal Server Error');
          return;
      }

      const data = JSON.parse(stdout);
      const indexes = data.map(log => log.Index);
      res.json(data);
  });
});
app.get('/requestSystemLogs', (req, res) => {
  const depth = req.query.depth || 100;
  const command = `Get-EventLog -LogName System -EntryType Error  -Newest ${depth}  | Select EventID, InstanceId, TimeGenerated, Index, Message | ConvertTo-Json`;

  exec(`powershell.exe -Command "${command}"`, (error, stdout, stderr) => {
      if (error) {
          console.error(`Error executing PowerShell command: ${error.message}`);
          res.status(500).send('Internal Server Error');
          return;
      }
      if (stderr) {
          console.error(`PowerShell command encountered an error: ${stderr}`);
          res.status(500).send('Internal Server Error');
          return;
      }

      const data = JSON.parse(stdout);
      const indexes = data.map(log => log.Index);
      res.json(data);
  });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Express server running on http://localhost:${port}`);
});

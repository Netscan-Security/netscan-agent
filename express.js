const express = require('express');
const path = require('path');
const cors = require("cors")
var os = require("os");
const fs = require('fs');
var cron = require('node-cron');
const axios = require('axios');
var convert = require('xml-js');
const { v4: uuidv4 } = require('uuid');



const { exec } = require('child_process');

const app = express();


app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '/'));

app.use(express.static(path.join(__dirname, "public")));

// Middlewares
///////////////////////////////////
// middleware to parse the request body
app.use(express.json());

// Cors middleware
app.use(cors());
///////////////////////////////////

async function sendApplicationLogs() {
  const depth = 100;
  console.log('start sending application logs to the server');
  const command = `Get-EventLog -LogName Application -EntryType Error  -Newest ${depth}  | Select EventID, InstanceId, TimeGenerated, Index, Message | ConvertTo-Json`;

  await exec(`powershell.exe -Command "${command}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing PowerShell command: ${error.message}`);
      //res.status(500).send('Internal Server Error');
      return;
    }
    if (stderr) {
      console.error(`PowerShell command encountered an error: ${stderr}`);
      //res.status(500).send('Internal Server Error');
      return;
    }

    const data = JSON.parse(stdout);
    const indexes = data.map(log => log.Index);
    //console.log('Data obtained from the client');
    axios.post('http://127.0.0.1:3000/logs/application/receive', {
      data
    })
      .then(function (response) {
        //console.log(response);
      })
      .catch(function (error) {
        //console.log(error);
      });
    //res.json(data);
  });
}

async function sendSecurityLogs() {
  const depth = 100;
  console.log('start sending application logs to the server');
  const command = `Get-EventLog -LogName System -EntryType Error  -Newest ${depth}  | Select EventID, InstanceId, TimeGenerated, Index, Message | ConvertTo-Json`;

  await exec(`powershell.exe -Command "${command}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing PowerShell command: ${error.message}`);
      //res.status(500).send('Internal Server Error');
      return;
    }
    if (stderr) {
      console.error(`PowerShell command encountered an error: ${stderr}`);
      //res.status(500).send('Internal Server Error');
      return;
    }

    const data = JSON.parse(stdout);
    const indexes = data.map(log => log.Index);
    //console.log('Data obtained from the client');
    axios.post('http://127.0.0.1:3000/logs/security/receive', {
      data
    })
      .then(function (response) {
        //console.log(response);
      })
      .catch(function (error) {
        //console.log(error);
      });
    //res.json(data);
  });
}





cron.schedule('* * * * *', () => {

  console.log('running a task every minute');
  sendApplicationLogs();
  sendSecurityLogs();
});
// Define a route to render an HTML file (for example)
app.get('/', (req, res) => {
  ////////////////////////////////////////
  // We have to figure out a way to know its the first time the app is running
  const firstTimeRun = true;
  ////////////////////////////////////////

  const networkInterfaces = os.networkInterfaces();

  const pageTitle = 'Express with EJS';
  const message = os.hostname();
  const ipv4Addresses = Object.values(networkInterfaces)
    .flatMap(interface => interface.filter(details => details.family === 'IPv4'))
    .map(details => details.address);

  res.render('index-2', { title: pageTitle, message, ipv4Addresses, firstTimeRun });
});

// route for scans history
app.get('/scans', (req, res) => {
  res.render('scan', { title: 'Scans History' });
});

// route for info
app.get('/info', (req, res) => {
  res.render('info', { title: 'System Info' });
});

// route for settings
app.get('/settings', (req, res) => {
  res.render('settings', { title: 'Settings' });
});

// First time registration form
app.post('/first-time', (req, res) => {
  // console.log('First time registration form submitted');
  console.log(req.body?.email);

  // Send a response to the client, include success key with value true
  if (req.body?.email === "netscan@netscan.com" && req.body?.password === "123456") {
    // mock user data
    const userData = {
      userId: "1",
      hasHost: false,
      firstName: "netscan",
      lastName: "netscan",
      profilePic: "https://avatars.githubusercontent.com/u/158183621?s=200&v=4",
      email: "netscan@netscan.com",
    };
    const mockToken = "eyJhbGci";

    // return success message, user data and a token
    res.json({
      userData,
      success: true,
      token: mockToken,
      message: 'Registration successful'
    });
  } else {
    console.log('Invalid email')
    // throw an error
    res.status(400).json({ success: false, message: 'Invalid email' });
  }
});

// Register host
app.post('/register-host', (req, res) => {
  console.log("Host Data: ", req.body);

  // Send a response to the client, include success key with value true
  if (req.body?.name === "Netscan PC") {
    res.json({ success: true, message: 'Host registration successful' });
  } else {
    console.log('Failed to register host')
    res.status(400).json({ success: false, message: 'Failed to register host' });
  }
});

app.get('/listdir', (req, res) => {

  fs.readdir('.', (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Send the list of files as JSON response
    res.json({ files });
  });
});

app.get('/scanfile', (req, res) => {
  const file = "Latest Invoice #3232.iso";
  exec(`"C:\\Users\\Mwanafunzi\\Desktop\\work\\netscan-agent\\clamav-1.3.0.win.x64\\clamdscan.exe" "C:\\Users\\Mwanafunzi\\Documents\\${file}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing command:', error);
      res.status(500).send('Internal Server Error');
      return;
    }

    // If there is any output, send it as the response
    const response = stdout || stderr;
    res.send(response);
  });
});



app.get('/requestApplicationLogs', (req, res) => {
  // you can pass query parameters to the URL like this: http://localhost:3000/requestApplicationLogs?depth=10
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
  // you can pass query parameters to the URL like this: http://localhost:3000/requestSystemLogs?depth=10
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


app.get('/getSystemInfo', (req, res) => {
  //No need to pass any query parameters to the URL
  const processorCommand = 'Get-WmiObject -Class Win32_Processor | Select-Object Name, Manufacturer, MaxClockSpeed, NumberOfCores | ConvertTo-Json';
  const videoControllerCommand = 'Get-WmiObject -Class Win32_VideoController | Select-Object Name, AdapterRAM | ConvertTo-Json';
  const ipAddressCommand = 'Get-NetIPAddress | Where-Object { $_.AddressFamily -eq \'IPv4\' } | Select-Object IPAddress, InterfaceAlias | ConvertTo-Json';
  const physicalMemoryCommand = '(Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property capacity -Sum).sum / 1gb';
  const computerInfoCommand = 'Get-ComputerInfo OsName,OsVersion,OsBuildNumber,OsHardwareAbstractionLayer,WindowsVersion,CsModel | ConvertTo-Json';
  const hardDiskCommand = '(Get-Disk 0).size / 1gb';

  // Execute commands asynchronously
  Promise.all([
    executePowerShellCommand(processorCommand),
    executePowerShellCommand(videoControllerCommand),
    executePowerShellCommand(ipAddressCommand),
    executePowerShellCommand(physicalMemoryCommand),
    executePowerShellCommand(computerInfoCommand),
    executePowerShellCommand(hardDiskCommand)
  ])
    .then(results => {
      const [processorData, videoControllerData, ipAddressData, physicalMemoryData, computerInfoData, hardDiskData] = results;
      const mergedData = {
        processorInfo: JSON.parse(processorData),
        videoControllerInfo: JSON.parse(videoControllerData),
        ipAddressInfo: JSON.parse(ipAddressData),
        physicalMemoryGB: parseFloat(physicalMemoryData),
        computerInfo: JSON.parse(computerInfoData),
        hardDiskGB: parseFloat(hardDiskData)
      };
      res.json(mergedData);
    })
    .catch(error => {
      console.error(`Error executing PowerShell command: ${error}`);
      res.status(500).send('Internal Server Error');
    });
});

function executePowerShellCommand(command) {
  return new Promise((resolve, reject) => {
    exec(`powershell.exe -Command "${command}"`, (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing PowerShell command: ${error.message}`);
      }
      if (stderr) {
        reject(`PowerShell command encountered an error: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

app.get('/scanResults', (req, res) => {
  try {
      const scanFile = req.query.xmlfile || 'nmap_output.xml';
      const xmlRes = fs.readFileSync(scanFile, 'utf8');
      const jsonRes = convert.xml2json(xmlRes, { compact: true, spaces: 4 });

      const data3 = JSON.parse(jsonRes);

      const serviceDataArray = [];

      for (let i = 0; i < data3.nmaprun.host.ports.port.length; i++) {
          const serviceData = {
              name: data3.nmaprun.host.ports.port[i].service._attributes.name,
              product: data3.nmaprun.host.ports.port[i].service._attributes.product !== undefined ? data3.nmaprun.host.ports.port[i].service._attributes.product : 'undefined',
              version: data3.nmaprun.host.ports.port[i].service._attributes.version !== undefined ? data3.nmaprun.host.ports.port[i].service._attributes.version : 'undefined',
              port: data3.nmaprun.host.ports.port[i]._attributes.portid,
              protocol: data3.nmaprun.host.ports.port[i]._attributes.protocol,
              status: data3.nmaprun.host.ports.port[i].state._attributes.state
          };
          serviceDataArray.push(serviceData);
      }

      res.json(serviceDataArray);
  } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/networkScan', (req, res) => {
  // Define target IP
  const target = '127.0.0.1';
  const scanUotput = uuidv4();
  
  // Run Nmap scan command
  exec(`nmap -sV -oX ${scanUotput}.xml ${target}`, (error, stdout, stderr) => {
      if (error) {
          console.error('Error occurred during Nmap scan:', error);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
      }
      
      if (stderr) {
          console.error('Nmap command error:', stderr);
          res.status(500).json({ error: 'Nmap Command Error' });
          return;
      }

      try {
          // Read the XML output file
          const xmlRes = fs.readFileSync(`${scanUotput}.xml`, 'utf8');
          const jsonRes = convert.xml2json(xmlRes, { compact: true, spaces: 4 });
          const data3 = JSON.parse(jsonRes);

          const serviceDataArray = [];

          for (let i = 0; i < data3.nmaprun.host.ports.port.length; i++) {
              const serviceData = {
                  name: data3.nmaprun.host.ports.port[i].service._attributes.name,
                  product: data3.nmaprun.host.ports.port[i].service._attributes.product !== undefined ? data3.nmaprun.host.ports.port[i].service._attributes.product : 'undefined',
                  version: data3.nmaprun.host.ports.port[i].service._attributes.version !== undefined ? data3.nmaprun.host.ports.port[i].service._attributes.version : 'undefined',
                  port: data3.nmaprun.host.ports.port[i]._attributes.portid,
                  protocol: data3.nmaprun.host.ports.port[i]._attributes.protocol,
                  status: data3.nmaprun.host.ports.port[i].state._attributes.state
              };
              serviceDataArray.push(serviceData);
          }

          // Send JSON data as response
          res.json(serviceDataArray);
      } catch (error) {
          console.error('Error occurred:', error);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  });
});


// Start the server
/*
let's use port other port than 3000 because netscan need to be running all the time
and they might be want to use port 3000 for their own purpose
for this reason we will use port 8443
*/
const port = 8443;
app.listen(port, () => {
  console.log(`Express server running on http://localhost:${port}`);
});

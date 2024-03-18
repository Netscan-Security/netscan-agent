var os = require("os");
const fs = require('fs');
const cors = require("cors");
const path = require('path');
const axios = require('axios');
var convert = require('xml-js');
var cron = require('node-cron');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const userDataFile = 'credentials.netscan'

// Local imports
const { registerHost } = require('./shared/services/host');
const { login } = require('./shared/services/authentication');

const app = express();

const API_AWS = 'https://netscanapi.thibitisha.com'

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, '/'));

app.use(express.static(path.join(__dirname, "public")));

// Middlewares
///////////////////////////////////
// middleware to parse the request body
app.use(express.json());

// Cors middleware
app.use(cors());


function makeBackgroundVirusScan(uuid) {
  return new Promise((resolve, reject) => {
    // Simulating a delay of 5 seconds
    setTimeout(() => {

      const command = `clamscan C:\\Users\\Kitchen\\Desktop\\ --remove=yes -r > ${uuid}.scan`;

      exec(command, { maxBuffer: 10000 * 1024 }, (error, stdout, stderr) => {
        if (error) {
          console.log(error.message)

          return;
        }
        if (stderr) {
          console.log(stderr)
          return;
        }


      });






    }, 50000); // Adjust delay time as needed
  });
}


function makeBackgroundScan() {
  return new Promise((resolve, reject) => {
    // Simulating a delay of 5 seconds
    setTimeout(() => {
      const target = '127.0.0.1';
      const scanOutput = uuidv4();

      // Run Nmap scan command
      exec(`nmap -sV -oX ${scanOutput}.xml ${target}`, (error, stdout, stderr) => {
        if (error) {
          console.error('Error occurred during Nmap scan:', error);
          reject(error);
          return;
        }

        if (stderr) {
          console.error('Nmap command error:', stderr);
          reject(stderr);
          return;
        }

        try {
          // Read the XML output file
          const xmlRes = fs.readFileSync(`${scanOutput}.xml`, 'utf8');
          const jsonRes = convert.xml2json(xmlRes, { compact: true, spaces: 4 });
          const data = JSON.parse(jsonRes);

          const serviceDataArray = [];

          for (let i = 0; i < data.nmaprun.host.ports.port.length; i++) {
            const serviceData = {
              name: data.nmaprun.host.ports.port[i].service._attributes.name,
              product: data.nmaprun.host.ports.port[i].service._attributes.product || 'undefined',
              version: data.nmaprun.host.ports.port[i].service._attributes.version || 'undefined',
              port: data.nmaprun.host.ports.port[i]._attributes.portid,
              protocol: data.nmaprun.host.ports.port[i]._attributes.protocol,
              status: data.nmaprun.host.ports.port[i].state._attributes.state
            };
            serviceDataArray.push(serviceData);
          }

          // Log serviceDataArray (you can do further processing here)



          // Resolve the promise
          resolve(serviceDataArray);
          console.log(serviceDataArray);
          try {
            const response =  axios.post(`${API_AWS}/scan/receive/results`, serviceDataArray);
            console.log('Response:', response.data);
            return response.data;
          } catch (error) {
            console.error('Error occurred while sending scan results:', error);
            throw error;
          }
        } catch (error) {
          console.error('Error occurred:', error);
          reject(error);
        }
      });

    }, 5000); // Adjust delay time as needed
  });
}

// Call the function

///////////////////////////////////
async function getHostId(userid) {
  try {
    const response = await axios.get(`${API_AWS}/host/user/${userid}`); // Replace the URL with your actual API endpoint
    const hostId = response.data.hostId; // Assuming the response contains a property named hostId
    console.log('Host ID:', hostId);

    // You can save the hostId to a file if needed
    fs.writeFileSync('hostId.txt', hostId); // Write hostId to a file named hostId.txt
    console.log('Host ID saved to hostId.txt');

    return hostId;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
async function sendApplicationLogs() {


  var userID;
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
    fs.readFile(userDataFile, 'utf8', async (err, Userdata) => {
      if (err) {
        console.error('Error reading file:', err);
        return;
      }

      try {
        // Parse the JSON string into a JavaScript object
        const jsonData = JSON.parse(Userdata);

        // Obtain the userId
        const userId = jsonData.userData.id;

        const HostId = (await axios.get(`${API_AWS}/host/user/${userId}`)).data.id
        console.log('AXIOS', HostId)
        console.log("User ID:", userId);
        axios.post(`${API_AWS}/logs/application/receive`, {

          'hostId': HostId,
          'log': data

        })
            .then(function (response) {
              //console.log(response);
            })
            .catch(function (error) {
              //console.log(error);
            });
        userID = userId
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
      }
    });
  });
}


app.get('/trigger-scan', async (req, res) => {
  try {
    // Execute the background scan
    makeBackgroundScan();
    // Respond with a message
    res.json({ message: 'Background scan triggered successfully' });
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: 'An error occurred while triggering the background scan' });
  }
});

app.get('/trigger-virus-scan', async (req, res) => {
  try {
    const scanUotput = uuidv4();
    // Execute the background scan
    makeBackgroundVirusScan(scanUotput);
    // Respond with a message
    res.json({ message: 'Background virus scan triggered successfully', scanid: `${scanUotput}.scan` });
  } catch (error) {
    // Handle errors
    res.status(500).json({ error: 'An error occurred while triggering the background scan' });
  }
});

app.get('/getScanResults', (req, res) => {
  // Retrieve query parameters from the URL
  const scanid = req.query.scanid;

  fs.readFile(scanid, (err, data) => {
    if (err) {
      // If there's an error reading the file, send an error response
      return res.status(500).send('Error reading file');
    }

    // Send the file as a response
    res.setHeader('Content-Type', 'text/plain'); // Set the appropriate content type
    res.send(data);
  });
});
async function sendSecurityLogs() {
  var userID
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
    fs.readFile(userDataFile, 'utf8', async (err, Userdata) => {
      if (err) {
        console.error('Error reading file:', err);
        return;
      }

      try {
        // Parse the JSON string into a JavaScript object
        const jsonData = JSON.parse(Userdata);

        // Obtain the userId
        const userId = jsonData.userData.id;

        const HostId = (await axios.get(`${API_AWS}/host/user/${userId}`)).data.id
        console.log('AXIOS', HostId)
        console.log("User ID:", userId);
        axios.post(`${API_AWS}/logs/application/receive`, {

          'hostId': HostId,
          'log': data

        })
            .then(function (response) {
              //console.log(response);
            })
            .catch(function (error) {
              //console.log(error);
            });
        userID = userId
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
      }
    });
  });
}
cron.schedule('* * * * *', () => {

  console.log('running a task every minute');
  sendApplicationLogs();
  sendSecurityLogs();
});
// Define a route to render an HTML file (for example)
app.get('/', (req, res) => {
  const networkInterfaces = os.networkInterfaces();

  const pageTitle = 'Express with EJS';
  const message = os.hostname();
  const ipv4Addresses = Object.values(networkInterfaces)
    .flatMap(interface => interface.filter(details => details.family === 'IPv4'))
    .map(details => details.address);

  res.render('index-2', { title: pageTitle, message, ipv4Addresses });
});

// route for scans history
app.get('/scans', (req, res) => {

  fs.readFile(userDataFile, 'utf8', async (err, Userdata) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    try {
      // Parse the JSON string into a JavaScript object
      const jsonData = JSON.parse(Userdata);

      // Obtain the userId
      const userId = jsonData.userData.id;

      const HostId = (await axios.get(`${API_AWS}/host/user/${userId}`)).data.id
      console.log('SCAN_USER_HOST_ID', HostId)
      console.log("USER_ID_SCAN", userId);
      const lastScan = ((await axios.get(`${API_AWS}/antivirus/lastscan/${userId}`)).data)

      console.log('lastscan' ,lastScan)
      res.render('scan', { title: 'Scans History', 'lastscan': lastScan });


      userID = userId
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
    }
  });

});


//route for cheking disks

app.get('/disk-usage', (req, res) => {
  // you can pass query parameters to the URL like this: http://localhost:3000/requestSystemLogs?depth=10
  const depth = req.query.depth || 100;
  const command = `Get-Volume | Select-Object DriveLetter, FileSystemLabel, @{Name='Capacity(GB)'; Expression={[math]::Round($_.Size / 1GB, 2)}}, @{Name='FreeSpace(GB)'; Expression={[math]::Round($_.SizeRemaining / 1GB, 2)}}, @{Name='UsedSpace(GB)'; Expression={[math]::Round(($_.Size - $_.SizeRemaining) / 1GB, 2)}} | ConvertTo-Json`;

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

// route for info
app.get('/info', async (req, res) => {
  const memUsage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;

  async function getDiskInfo() {

    return await axios.get('http://127.0.0.1:8443/disk-usage')

  }



  const diskInfo =  ((await getDiskInfo()).data)




  function cpuAverage() {

    //Initialise sum of idle and time of cores and fetch CPU info
    var totalIdle = 0, totalTick = 0;
    var cpus = os.cpus();

    //Loop through CPU cores
    for (var i = 0, len = cpus.length; i < len; i++) {

      //Select CPU core
      var cpu = cpus[i];

      //Total up the time in the cores tick
      for (type in cpu.times) {
        totalTick += cpu.times[type];
      }

      //Total up the idle time of the core
      totalIdle += cpu.times.idle;
    }

    //Return the average Idle and Tick times
    return {idle: totalIdle / cpus.length, total: totalTick / cpus.length};
  }

//Grab first CPU Measure
  var startMeasure = cpuAverage();
  var perc;
//Set delay for second Measure
  setTimeout(function () {

    //Grab second Measure
    var endMeasure = cpuAverage();

    //Calculate the difference in idle and total time between the measures
    var idleDifference = endMeasure.idle - startMeasure.idle;
    var totalDifference = endMeasure.total - startMeasure.total;

    //Calculate the average percentage CPU usage
    var percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);

    //Output result to console
    console.log(percentageCPU + "% CPU Usage.");
    res.render('info', {title: 'System Info', 'memusage': memUsage.toFixed(2), 'CPUusage': percentageCPU, 'disk': diskInfo });


  }, 100);

});

// route for settings
app.get('/settings', async (req, res) => {
  async function getAvVersion() {
    return (await axios.get('http://127.0.0.1:8443/clamd/version')).data.version
  }

  const version = await getAvVersion();
  console.log(version)
  res.render('settings', {title: 'Settings', version: version});
});

// First time registration form
app.post('/first-time', async (req, res) => {
  try {
    const response = await login(req.body?.email, req.body?.password, true)


    const jsonString = JSON.stringify(response, null, 2); // The second argument is for pretty formatting, setting it to null

    await fs.writeFile(userDataFile, jsonString, (err) => {
      if (err) {
        console.error('Error writing to file:', err);
        return;
      }
      console.log('JSON data has been written to', userDataFile);
    });



    // return success message, user data and a token
    res.json({
      userData: response?.userData,
      success: true,
      token: response?.token,
      message: 'Login successful'
    });
  } catch (error) {
    console.log(error?.message)
    // throw an error
    res.status(400).json({ success: false, message: 'failed to login' });
  }
});

// Register host
app.post('/register-host', async (req, res) => {
  try {
    const response = await registerHost(req.body);

    res.json({
      hostData: response?.hostData,
      success: true, message: 'Host registration successful'
    });
  } catch (error) {
    console.log('Failed to register host')
    console.log(error?.message)
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
  const scanFlags = req.query.options || '';
  let bufferObj = Buffer.from(scanFlags, "base64");
  let decodedString = bufferObj.toString("utf8");
  console.log(decodedString)
  const target = '127.0.0.1';
  const scanUotput = uuidv4();
  console.log(scanFlags)

  // Run Nmap scan command
  exec(`nmap -sV ${scanFlags} -oX ${scanUotput}.xml ${target}`, (error, stdout, stderr) => {
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



app.get('/clamd/version', (req, res) => {
  const command = 'clamdscan --version';

  exec(command, { maxBuffer: 10000 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (stderr) {
      res.status(500).json({ error: stderr });
      return;
    }
    const version = stdout.trim();
    res.json({ version });
  });
});

app.get('/clamd/scan', (req, res) => {
  const command = 'clamscan C:\\Users\\Kitchen\\Desktop\\ --remove=yes -r > haha2';

  exec(command, { maxBuffer: 10000 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (stderr) {
      res.status(500).json({ error: stderr });
      return;
    }

    const lines = stdout.split('\n');
    const fileScanResults = [];
    let scanSummaryFound = false;

    lines.forEach(line => {
      // Check if it's the scan summary
      if (line.includes('----------- SCAN SUMMARY -----------')) {
        scanSummaryFound = true;
        return; // Skip this line
      }

      if (line.trim() !== '' && !scanSummaryFound) {
        const [filePath, result] = line.split(': ');
        fileScanResults.push({ filePath: filePath.trim(), result: result.trim() });
      }
    });

    res.write('{ "fileScanResults": [\n');
    fileScanResults.forEach((result, index) => {
      res.write(JSON.stringify(result));
      if (index < fileScanResults.length - 1) {
        res.write(',\n');
      } else {
        res.write('\n');
      }
    });
    res.write('] }\n');
    res.end();
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

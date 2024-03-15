
# NetScan Agent

This is basically a client app that will be installed to end user. the application itself is written in Express.js, Electron.js and C++

# Prerequesite


```nmap``` should be installed for scan services to work,  

[Nmap Download](https://nmap.org/dist/nmap-7.94-setup.exe)

When we reach the time to build the installer for clients we can embed the nmap executable and will be insalled during agent installation.


## Getting Started

Install set up netscan development and testing environment

```bash
  https://github.com/Netscan-Security/netscan-agent.git

```

```bash
  cd etscan-agent
```
```bash
  npm install
```
```bash
  npm start
```
    

## To build executables

```bash
    electron-packager . NetScan --platform=win32 --arch=x64 --out=dist --overwrite
```


## API Reference

#### Get application logs

```http
  GET /requestApplicationLogs?depth=100
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `depth` | `number` | **Optional**. Logs depth |

#### Get system logs

```http
  GET /requestSystemLogs?depth=100
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `depth`      | `number` | **Optional**. Logs depth |



#### Get system logs

```http
  GET /networkScan?options=${option}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `option`      | `string` | **Optional**. Scan type |

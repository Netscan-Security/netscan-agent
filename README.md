<p align="center">
  <img width="100" src="https://imgur.com/3cw4DQr.png" alt="NetScan Security Logo" />
  <h2 align="center">NetScan Client</h2>
  <p align="center">Precision Scans, Real-time Defense</p>
</p>

# Description

This is a client app that will be installed on the host computer. the application itself is written in Express.js, Electron.js, and C++


## Getting Started

Install set up NetScan development and testing environment

```bash
  https://github.com/Netscan-Security/netscan-agent.git

```

```bash
  cd netscan-agent
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



#### Perform network port scanning

```http
  GET /networkScan?options={option}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `depth`      | `string` | **Optional**. Optional |


#### Retrieve scan results

```http
  GET /scanResults?xmlfile=${uuid.xml}
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `xmlfile`      | `string` | **Required**. Required |

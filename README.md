
# NetScan Client

This is basically a client app that will be installed to end user. the application itself is written in Express.js, Electron.js and C++


## Running the project

To run this project run

```bash
  git clone https://github.com/Netscan-Security/netscan-client.git
```
```bash
  cd netscan-client && npm install
```
```bash
  npm start
```
To build executables

```bash
  electron-packager . NetScan --platform=win32 --arch=x64 --out=dist --overwrite
```

You should find executables in release folder ready for distribution


## Contributing

Contributions are always welcome!


# Tap Tap Adventure - Cercle des Sciences Edition

Tap Tap Adventure - Cercle des Sciences Edition (TTA-CdS) is a massively multi-player online open-source project based on Tap Tap Adventure.

The entirety of the source has been rewritten from the ground up, this includes rendering, networking, sprite parsing, map loading, etc. The code remains true to its coding conventions and follows it thoroughly. Although, compared to its predecessor, the code is far more comprehensive and adaptable, it is, as all other repositories on this website, a work in progress. If your capabilities include following onset conventions, you are welcome to contribute!

## Running Tap Tap Adventure

Running the server is fairly straightforward, for the most part. If you encounter any issues, make sure you use the alternative solution.

First, you must `clone` the repository. There's really no way around it, you kinda need the source to run it, y'know?

###### Step 1 - Install the dependencies

`sudo npm install -d`


###### Step 2 - Installing the utilities

You can either choose to install MySQL for full distribution, or simply enable `offlineMode` in the server configuration.

If you choose to use MySQL, install `mysql-server` for the operating system you're using, and update the `config.json` in `server` folder to contain your details.


###### Step 2 - Run the server

`node server/js/main.js`

In most cases, the server was programmed to automatically generate the MySQL data in the database given, in the event this does not occur, there are two solutions you can attempt:

1) Grant the MySQL user FULL permissions
2) Run or query the `.sql` file in the `tools` folder.

###### Step 3 - Connect to the server

`http://127.0.0.1:1800`


That's it, as easy as 1, 2, 3, with many sub-procedures to follow :l

### For Developers

If you are planning on aiding with development, I highly suggest installing `nodemon` as a npm dependency, it automatically restarts the server and saves you the hassle.

![](http://oi64.tinypic.com/sr4h.jpg)

# Bri5cola author *Ismaele Benbachir*

## The game

See: https://www.pagat.com/aceten/briscola_chiamata.html

## Getting Started

The code is written in nodejs: '10.13.0';

package manager npm: '6.4.1';

Tested on Linux 4.15.0-43-generic x86_64.

From git repository:

`$ git clone https://github.com/UniCT-WebDevelopment/Briscola5 name`

Target directory is called 'name' (it can be omitted).
To start server:

`npm start`

You need to have a MySQL Database on port *8846*.
Server is running on port *80*. On linux you can run:
```
sudo apt-get install libcap2-bin
sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``
```
to enable port 80.

Create first the database using the .sql file you find in the root directory.
If your configuration is the default MySQL configuration run
`$node start`
to start the server. If need any particular configuration, edit *server.js*  inside the server directory. (you have to change directory to project/server).

### Modules

- 'express'
- 'http'
- 'socket.io'
- 'path'
- 'body-parser'
- 'express-session'
- 'bcrypt'
- 'mysql'

## Project

The project consists of 2 main folders: client and server.

### Client

- ***index.html*** login and sign in
- ***lobby.html*** views for lobby and in game
- ***chat-lobby.js*** socket.io for the lobby and game chat
- ***game-manager.js*** render and manager for in game play
- ***lobby-manager.js*** manager for lobby
- ***request-manager.js*** http request for login and sign in and manager for reconnection
- ***socket-config.js***: for socket connection

### Server

- ***room.js*** class for room
- ***server.js*** server manager

## Features

- Support reconnection in game;
- Chat in game and chat in lobby;
- Button to activate the play timeout;
- Disconnection management;
- User record with number of wins, losses and score;
- Session use;
- Player always at the bottom of the table during the game;
- Single login per user;
- At the second disconnection the game is closed;
- Button for the game abandonment (no penalty for the moment);
 
## Cooperation

Carmelo Buscemi

### With the help of

Nunzio Mio

Andrea Longhitano

Filippo Alfio Cicolò

Alessandra Di Fiore

### Contacts

Email: ismaelebnb93@hotmail.it

Facebook: Ismaele Bnb

##### Last note

The code is not easy to read. I'll fix it in future updates.

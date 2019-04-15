const u_host = window.location.hostname,
    port = window.location.port;
var socket = io(`http://${u_host}:${80}`);

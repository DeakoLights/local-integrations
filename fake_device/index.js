var PORT = 23
let first_ping = true;

function start_advertising(sn, fw) {
    var mdns = require('mdns');

    var txt_record = {
        version: fw,
        sn: sn,
    };

    var ad = mdns.createAdvertisement(mdns.tcp('_telnet'), PORT, {
        txtRecord: txt_record,
        name: "local-integration",
    });
    ad.start();
}

function start_telnet_server(on_data) {
    var sockets = [];
    var net = require('net');

    /*
     * Callback method executed when data is received from a socket
     */
    function receiveData(data) {
        for (var i = 0; i < sockets.length; i++) {
            on_data(sockets[i], data)
        }
    }

    function closeSocket(socket) {
        var i = sockets.indexOf(socket);
        if (i != -1) {
            sockets.splice(i, 1);
        }
    }

    /*
     * Callback method executed when a new TCP socket is opened.
     */
    function newSocket(socket) {
        sockets.push(socket);
        console.log("things connected");
        socket.on('data', function (data) {
            receiveData(data);
        })

        socket.on('end', function () {
            console.log("things disconnected");
            closeSocket(socket);
        })
    }

    // Create a new server and provide a callback for when a connection occurs
    var server = net.createServer(newSocket);

    // Listen on port 1337
    server.listen(PORT);

    process.on('exit', () => {
        server.close();
    });
}

function send_json(socket, json) {
    const json_str = JSON.stringify(json);
    console.log("Sending Data:", json_str);
    socket.write(json_str + "\r\n");
}

function handle_incoming_data(socket, data, profile) {

    console.log("RAW Data:", data);
    const data_json = JSON.parse(data);
    console.log("Received Data:", data);

    if (data_json.type == "PING") {
        const ping = {
            transactionId: data_json.transactionId,
            src: data_json.dst,
            dst: data_json.src,
            type: "PING",
            status: "ok",
            timestamp: new Date().getTime()
        };
        send_json(socket, ping)
        return;
    }

    if (data_json.type == "DEVICE_LIST") {

        const device_list_resp = {
            transactionId: data_json.transactionId,
            src: data_json.dst,
            dst: data_json.src,
            timestamp: new Date().getTime(),
            type: "DEVICE_LIST",
            status: "ok",
            data: {
                number_of_devices: profile.lights.length
            }
        };

        send_json(socket, device_list_resp);

        for (const light of profile.lights) {

            const device_one = {
                type: "DEVICE_FOUND",
                src: data_json.dst,
                timestamp: new Date().getTime(),
                data: {
                    name: light.name,
                    uuid: light.uuid,
                    capabilities: light.capabilities,
                    state: {
                        power: false,
                        dim: 21
                    }
                }
            }
            send_json(socket, device_one);
        }
        return;
    };

    if (data_json.type == "CONTROL") {
        // do notiing yet.
        return;
    }
    console.log("UNHANDLED", data);
}

function run(profile) {
    start_advertising(profile.bridge_sn, profile.bridge_fw);
    start_telnet_server((socket, data) => {
        handle_incoming_data(socket, data.toString(), profile);
    });
}

var profile = require('./profile.json')
run(profile);
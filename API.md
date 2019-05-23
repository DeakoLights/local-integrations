# Deako Telnet Integrations

* 1.0 - Initial Documentation - 10/26/18
* 1.1 - Added Ping Command    - 3/15/19
* 1.2 - Added additional MDNS docs - 3/22/19
* 1.3 - Fixed device found response to include state - 4/18/19
* 1.4 - Added notes about message requirements and connection flow - 5/1/19

# 1.0 Summary

Communication Messages for Deako telnet integrations.

After discovering the Deako Connect with Bonjour, the following messages 
can be sent to the device via telnet (port 23).

Please note that the message examples below are formated. The responses that 
the client will send and receive will be unformatted, single line JSON.

## 1.1 Message Requirements

1) All messages sent to and from the Deako Connect must/will be on a single line, seperated by CRLF line endings.
2) For best results, please do not send messages faster than 800 ms apart.

# 2.0 Message Contents

There are three forms that messages can take:

1) Solicited Requests
2) Solicited Responses
3) Unsolicited Messages

Solicited Requests are from the integrator to the Deako Connect.

Solicited Responses are in response to a Solicited Request and originate from
the Deako Connect.

Unsolicted Messages originate from the Deako Connect to changes that the integrator has subscribed to.

The contents of **solicited request** message will be stuctured as such:

```
{
    "transactionId": {{ a unique uuid v4 }},
    "type": {{ the message type }},
    "dst": {{ the device that should listen and respond to this message }},
    "src": {{ the device or service requesting this }},
    "data": {{ Extra JSON data for this type}}
}
```

The contents of **solicited response** message will be stuctured as such:

```
{
    "transactionId": {{ same uuid as the input message }},
    "type": {{ the message type }},
    "status": {{ ok or error }},
    "dst": {{ the device that requested this message }},
    "src": {{ the device responding to this }},
    "timestamp": {{ unix epoch, time this event occured }},
    "status": {{ "ok" or "error" },
    "data": {{ if status is ok: Extra JSON data for type, else error payload }}
}
```

The contents of an **unsolicited** message will be stuctured as such:

```
{
    "type": {{ the message type }},
    "dst"?: {{ the device this message is sending to, optional}},
    "src": {{ the device this message is coming from }}, 
    "timestamp": {{ unix epoch, time this event occured }},
    "data": {{ Extra JSON response data for this type }}
}
```

# 3.0 Message Types

More messages will be added in the future as we add more features. Currently there are four message types:

1) DEVICE_LIST
2) DEVICE_FOUND
3) EVENT
4) CONTROL

## 3.1 Device Listing

To get a list of devices:
1) Send a device list request
2) Read from the response the number of devices that were found
3) Wait and listen for unsolicited events that come from the bridge for the corresponding # of devices

### 3.1.1 Get current device list (solicited request):
```json
{
    "transactionId": "015c44d3-abec-4be0-bb0d-34adb4b81559",
    "type": "DEVICE_LIST",
    "dst": "deako",
    "src": "ACME Corp"
}
```

### 3.1.2 Return the current device list (solicited response):
```json
{
    "transactionId": "015c44d3-abec-4be0-bb0d-34adb4b81559",
    "type": "DEVICE_LIST",
    "dst": "ACME Corp",
    "src": "deako",
    "timestamp": 00000000000000001,
    "status": "ok",
    "data": {
        "number_of_devices": 30
    }
}
```

### 3.1.3 Return back a device (unsolicited):

This will happen after the above response for as many devices as we have
on a profile.

```json
{
    "type": "DEVICE_FOUND",
    "src": "deako",
    "timestamp": 00000000000000001,
    "data": {
        "name": "Living Room",
        "uuid": "3748292-28388292-8474728293-8838383",
        "capabilities": "power+dim",
        "state": {
            "power": false,
            "dim": 21
        }
    }
}
```

## 3.2 Event Types

Events are actions that have taken place on the profile.

Each `EVENT` type will have a payload that contains an `eventType` key to designate what kind of event this `EVENT` is.

There are two keys that state can contain: `power` and `dim`. See section `3.4 Device Capabilities`

There is currently only one event type:

1) DEVICE_STATE_CHANGE

### 3.2.1 Device State Change
```json
{
    "type": "EVENT",
    "src": "deako",
    "timestamp": 00000000000000001,
    "data": {
        "eventType": "DEVICE_STATE_CHANGE",
        "id": "3748292-28388292-8474728293-8838383",
        "state": {
            "power": false,
            "dim": 21
        }
    }
}
```

## 3.3 Device Control Request

These requests allow a client to manipulate the state of devices on a Deako Profile.

There are two keys that state can contain: `power` and `dim`. See section `3.4 Device Capabilities`

After sending a Device Control Request the Deako Connect will respond back to let the client
know that the Request is being processed. After the Request has been processed, an unsolicited Device State Change
event will take place with the updated device state. 

### 3.3.1 change device state (solicited request):
```json
{
    "transactionId": "015c44d3-abec-4be0-bb0d-34adb4b81559",
    "type": "CONTROL",
    "dst": "deako",
    "src": "ACME Corp",
    "data": {
        "target": "3748292-28388292-8474728293-8838383",
        "state": {
            "power": false,
            "dim": 21
        }
    }
}
```

### 3.3.2 change device state success (solicited response):
```json
{
    "transactionId": "015c44d3-abec-4be0-bb0d-34adb4b81559",
    "type": "CONTROL",
    "dst": "ACME Corp",
    "src": "deako",
    "timestamp": 00000000000000001,
    "status": "ok"
}
```

### 3.3.3 change device state error (solicited response):
```json
{
    "transactionId": "015c44d3-abec-4be0-bb0d-34adb4b81559",
    "type": "CONTROL",
    "dst": "ACME Corp",
    "src": "deako",
    "timestamp": 00000000000000001,
    "status": "error",
    "data": {
        "code": "DEVICE_BUSY",
        "message": "Device is busy"
    }
}
```

## 3.4 Device Ping

These requests allow a client to ping the Deako Connect.

### 3.4.1 Ping Request (solicited request)
```json
{
    "transactionId": "015c44d3-abec-4be0-bb0d-34adb4b81559",
    "type": "PING",
    "dst": "deako",
    "src": "ACME Corp"
}
```

### 3.4.2 Ping Response (solicited response)
```json
{
    "transactionId": "015c44d3-abec-4be0-bb0d-34adb4b81559",
    "type": "PING",
    "dst": "ACME Corp",
    "src": "deako",
    "timestamp": 00000000000000001,
    "status": "ok"
}
```

## 3.5 Device Capabilities

When receiving a `DEVICE_FOUND` message, you'll find that the payload contains a key called `capabilities`.
Currently possible values here are:

1) `power` - the device supports turning on and off
2) `power+dim` - the device supports turning on and off and dimming to a level.

When controlling these devices with the `CONTROL` message type, the client will send a `state` object with corresponding
states of the capabilities.

1) `power` is always `true` or `false` to indicate that the device is on or off.
2) `dim` is always a value between 0 - 100 to indicate the dim level that the light is at.

When receiving a `DEVICE_STATE_CHANGE` eventType, the client will find a `state` object with the same keys.


## 3.6 Error types

The following errors can take place. This document may be updated
in the future with more error types.

1) DEVICE_BUSY

This takes place when the Deako Connect is busy processing other requests

2) DEVICE_UNKNOWN

This takes place when the Device that a client is trying to communicate with
is unknown.

3) REQUEST_UNKNOWN

This can take place when the request that the client has sent to the Deako
Connect is not supported.

4) REQUEST_MALFORMED

This can take place when the request that the client has sent to the Deako
Connect is malformed.

# 4.0 MDNS (Bonjour)

After connecting the Deako Connect to wifi, the Connect will broadcast the
following mDNS information for discovery purposes:

* Service Type: ```_telnet```
* Service Name: ```local-integration```

The Deako Connect will also broadcast additional metadata:

* Firmware Version
* Unique Deako Device Serial Number

# 5.0 Connection Flow

When Connecting to the Deako Connect, the following steps should be taken:

1) Discover the service with mDNS
2) Connect to the Port and IP described by the mDNS service
3) Send a DEVICE_LIST message

If the Deako Connect responds, then you're up and connected. If not:

* Check to see if the Deako Connect is on the same network as you
* Check to see if the Deako Connect LED is white (if internet) or flashing blue (no internet, but on wifi)



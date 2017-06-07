// var debugLevel = 2;
// var peer = new Peer({ key: 'ce16d9aa-4119-4097-a8a5-3a5016c6a81c', /*debug: 3*/ });

// peer.on('open', id => {
//   console.log('peer on "open"');
//   myIdDisp.textContent = id;
//   btnStart.onclick = evt => {
//     webCamSetup(selfView).then(stream => {
//       var call = peer.call(callTo.value, stream);
//       callSetup(call);
//     });
//   }
// });

// peer.on('call', call => {
//   console.log('peer on "call"');
//   webCamSetup(selfView).then(stream => {
//     call.answer(stream);
//   });
//   callSetup(call);
// });

// function webCamSetup(elm) {
//   return navigator.mediaDevices.getUserMedia({ 
//     video: true, 
//     audio: false 
//   }).then(stream => {
//     elm.srcObject = stream;
//     return stream;
//   }).catch(ex => console.log('getUserMedia error.', ex));
// }

// function callSetup(call) {
//   call.on('stream', stream => {
//     console.log('call on "stream"');
//     remoteView.srcObject = stream;
//   });
//   call.on('close', _ => {
//     console.log('call on "close"');
//   });
// }


var apiKey = 'ce16d9aa-4119-4097-a8a5-3a5016c6a81c';
var token = Math.random().toString(36).substr(2);
var socket, pc, myId;
fetch(`https://skyway.io/${apiKey}/id?ts=${Date.now()}${Math.random()}`).then(res => res.text()).then(id => {
  myIdDisp.textContent = myId = id;
  socket = new WebSocket(`wss://skyway.io/peerjs?key=${apiKey}&id=${myId}&token=${token}`);
});

function socketSetup() {
  socket.onopen = function() {
    console.log('socket on open');
  }
  socket.onmessage = function(evt) {
    var msg = JSON.parse(evt.data);
    if(!pc) {
      pcSetup(msg.dst);
    }
    if(msg.type === 'OFFER') {
      pc.setRemoteDescription(new RTCPeerConnection(msg.ofr))
        .then(_ => {
          return pc.createAnswer();
        })
        .then(answer => {
          return pc.setLocalDescription(answer);
        })
        .then(_ => {
          socket.send(JSON.stringify({
            type: 'ANSWER',
            ans: pc.localDescription,
            dst: myId
          }));
        })
        .catch(ex => {
          console.log('Recieve Offer error.', ex);
        });
    } else if(msg.type === 'ANSWER') {
      pc.setRemoteDescription(new RTCSessionDescription(msg.ans))
        .catch(ex => {
          console.log('Recieve Answer error.', ex);
        });
    } else if(msg.type === 'CANDIDATE') {
      pc.addIceCandidate(new RTCIceCandidate(msg.cnd))
        .catch(ex => {
          console.log('Recieve Candidate error.', ex);
        });
    }
  }
}

function pcSetup(remoteId) {
  pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.skyway.io:3478' }] });
  pc.remoteId = remoteId;
  pc.onicecandidate = function (evt) {
    socket.send(JSON.stringify({ 
      type: 'CANDIDATE', 
      dst: this.remoteId 
    }));
  }
  pc.onnegotiationneeded = function(evt) {
    var that = this;
    that.createOffer()
      .then(offer => {
        return that.setLocalDescription(offer);
      })
      .then(_ => {
        socket.send(JSON.stringify({ 
          type: 'OFFER', 
          dst: that.remoteId
        }));
      });
  }
  pc.onaddstream = function(evt) {
    remoteView.srcObject = evt.stream;
  }
}

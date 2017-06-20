var debugLevel = 2;
var peer = new Peer({ key: 'ce16d9aa-4119-4097-a8a5-3a5016c6a81c', /*debug: 3*/ });
var call = null;

var videoDevices = null;
navigator.mediaDevices.enumerateDevices().then(devices => {
  videoDevices = devices.filter(device => device.kind === 'videoinput');
})

peer.on('open', id => {
  console.log('peer on "open"');
  myIdDisp.textContent = id;
  btnStart.style.display = '';
  btnStart.onclick = evt => {
    start();
  }
  var siId = null;
  siId = setInterval(_ => {
    peer.listAllPeers(function (list) {
      if (list && list.length > 1) {
        clearInterval(siId);
        if (!selfView.srcObject && !remoteView.srcObject) {
          callTo.value = list.filter(x => x !== myIdDisp.textContent)[0];
        }
      }
    });
  }, 3000);
});

function start() {
  webCamSetup(selfView, videoDevices[0]).then(stream => {
    call = peer.call(callTo.value, stream);
    callSetup(call);
  });
}

btnAddStream.onclick = evt => {
  webCamSetup(selfView, devices[1]).then(stream => {
    stream.getTracks().forEach(track => {
      call.localStream.addTrack(track);
    });
  });
}

peer.on('call', call => {
  console.log('peer on "call"');
  webCamSetup(selfView).then(stream => {
    call.answer(stream);
  });
  callSetup(call);
});

function webCamSetup(elm, device) {
  return navigator.mediaDevices.getUserMedia({
    video: { deviceId: device.deviceId },
    audio: false
  }).then(stream => {
    elm.srcObject = stream;
    return stream;
  }).catch(ex => console.log('getUserMedia error.', ex));
}

function callSetup(call) {
  call.on('stream', stream => {
    console.log('call on "stream"');
    remoteView.srcObject = stream;
    btnAddStream.style.display = '';
  });
  call.on('close', _ => {
    console.log('call on "close"');
  });
}
var debugLevel = 2;
var peer = new Peer({ key: 'ce16d9aa-4119-4097-a8a5-3a5016c6a81c', debug: 3 });

peer.on('open', id => {
  console.log('peer on "open"');
  myIdDisp.textContent = id;
  btnStart.onclick = evt => {
    webCamSetup(selfView).then(stream => {
      var call = peer.call(callTo.value, stream);
      callSetup(call);
    });
  }
});

peer.on('call', call => {
  console.log('peer on "call"');
  webCamSetup(selfView).then(stream => {
    call.answer(stream);
  });
  callSetup(call);
});

function webCamSetup(elm) {
  return navigator.mediaDevices.getUserMedia({ 
    video: true, 
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
  });
  call.on('close', _ => {
    console.log('call on "close"');
  });
}

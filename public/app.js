var fs = require('fs');
var Path = require('path');
var sniffer = require('nshey');

var running = false;
var chooser = document.querySelector('#saveFile');
var sniffButton = document.querySelector('#sniff');
var statusEl = document.querySelector('#status');
var logEl = document.querySelector('#log');
var channelsEl = document.querySelector('#channels');
var saveFilenameEl = document.querySelector('#saveFilename');
var outputEl = document.querySelector('#output');
var statusInterval;
var defaultPath = Path.join(process.env['HOME'], 'Desktop', 'packets.log');
var firstRun = true;

var nw = require('nw.gui');
win = nw.Window.get();
var nativeMenuBar = new nw.Menu({ type: "menubar" });
nativeMenuBar.createMacBuiltin("N.S.Heyyy");
win.menu = nativeMenuBar;

saveFilenameEl.addEventListener('click', function(evt) {
  chooser.click();
});

chooser.addEventListener('change', function(evt) {
  firstRun = false;
  if (this.value) {
    sniffButton.disabled = false;
  } else {
    sniffButton.disabled = true;
  }
  saveFilenameEl.textContent = this.value ? Path.basename(this.value) : '(click to choose)';
}, false);

sniffButton.addEventListener('click', function(evt) {
  if (running) {
    stopSniff();
  } else {
    var filename;
    if (!chooser.value && firstRun) {
      filename = defaultPath;
    } else {
      filename = chooser.value;
    }

    if (!filename || !channelsEl.value) {
      alert('Please select a file to save logs to');
      return false;
    }

    var channels = channelsEl.value.split(',');
    for (var i = 0; i < channels.length; i ++) {
      channels[i] = channels[i].trim();
    }

    startSniff(filename, channels);
  }
});

function startSniff(filename, channels){
  running = true;
  channelsEl.disabled = false;
  sniffButton.textContent = 'Stop';
  outputEl.style.display = 'block';

  sniffer.getInterface(function(obj) {
    var interfaceName;

    if (obj) {
      interfaceName = obj.name;
    } else {
      interfaceName = 'en0';
    }

    sniffer.sniff(interfaceName, function(data) {
      logEl.textContent += data;
      logEl.scrollTop = logEl.scrollHeight;
      fs.appendFile(filename, data, function (err) {
        if (err) {
          console.log(err);
        }
      });
    });

    sniffer.hop(channels);

    statusInterval = setInterval(function(){
      statusEl.textContent = 'Sniffing on channel ' + sniffer.getCurrentChannel();
    }, 500);
  });
}

function stopSniff() {
  running = false;
  channelsEl.disabled = false;
  sniffButton.textContent = 'Start';
  statusEl.textContent = 'Not sniffing';
  clearInterval(statusInterval);

  sniffer.stop();
}

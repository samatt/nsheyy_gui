var sniffer = require('nshey');
var fs = require('fs');
var Path = require('path');
var exec = require('child_process').exec;
var nw = require('nw.gui');

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
var win = nw.Window.get();

setupMenu();

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

function setupMenu() {
  var nativeMenuBar = new nw.Menu({ type: "menubar" });
  nativeMenuBar.createMacBuiltin("N.S.Heyyy", {hideEdit: true, hideWindow: true});
  win.menu = nativeMenuBar;

  var fileMenu = new nw.Menu();
  fileMenu.append(new nw.MenuItem({ label: 'Authenticate', click: function(){
    document.querySelector('#auth').style.display = 'block';
  }}));

  win.menu.append(new nw.MenuItem({label: 'File', submenu: fileMenu}));
}


document.querySelector('#authButton').addEventListener('click', function(evt) {
  authenticate(document.querySelector('#password').value, function(success) {
    if (success) {
      document.querySelector('#auth').style.display = 'none';
    } else {
      alert('Incorrect password, please try again.');
    }
  });
});

document.querySelector('#cancelButton').addEventListener('click', function(evt) {
  document.querySelector('#auth').style.display = 'none';
});

function authenticate(pw, cb) {
  exec('echo "'+pw+'" | sudo -S chmod o+r /dev/bpf*', function(error, stdout, stderr){
    if (error !== null) {
      if (error.toString().indexOf('incorrect password attempt') > -1) {
        console.log('incorrect password');
        cb(false);
      }
    } else {
      cb(true);
    }
  });
}


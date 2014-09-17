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
var interfaceEl = document.querySelector("#interface");
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

win.on('close',function(){
  if(running){
    alert("You have to stop sniffing before you quit");
    return;
  }
  this.close(true);
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
    console.log(filename);
    console.log(channels);
    startSniff(filename, channels);
  }
});

function startSniff(filename, channels,interface){
  running = true;
  channelsEl.disabled = false;
  sniffButton.textContent = 'Stop';
  outputEl.style.display = 'block';

  var options = options || {};
  if(filename){
    options.filename = filename;
  }
  else{
    options.filename = defaultPath;
  }

  if(channels){
    options.channels = channels;
  }
  else{
    options.channels = [1,6,11,36,40,44,48];
  }
  if(interface){
    options.interface = interface;
  }

  options.interval = 5000;

  options.cb = function(data){
    logEl.textContent += data;
    logEl.scrollTop = logEl.scrollHeight;
  };

  sniffer.start(options);

  statusInterval = setInterval(function(){
    statusEl.textContent = 'Sniffing on channel ' + sniffer.getCurrentChannel();
  }, 500);

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

  var snifferMenu = new nw.Menu();
  var interfaces = [];

  var addMenuItem = function(l,snifferMenu){
    snifferMenu.append(new nw.MenuItem({ label: l, click: function(){
      console.log("Clicked");
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
        console.log(filename);
        console.log(channels);
        interfaceEl.textContent = l;
        startSniff(filename, channels,l);
      }
    }}));
  }

  sniffer.getWiFiInterfaces(function(list){
    interfaceEl.textContent = list[0];
    for(var i = 0; i< list.length; i++){

      var label = list[i];
      console.log(list[i]);
      addMenuItem(list[i] ,snifferMenu);
    }

  });
  win.menu.append(new nw.MenuItem({label: 'Sniffer', submenu: snifferMenu}));
}


document.querySelector('#auth').addEventListener('submit', function(evt) {
  evt.preventDefault();
  authenticate(document.querySelector('#password').value, function(success) {
    if (success) {
      document.querySelector('#auth').style.display = 'none';
    } else {
      alert('Incorrect password, please try again.');
    }
  });
});

document.querySelector('#cancelButton').addEventListener('click', function(evt) {
  evt.preventDefault();
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


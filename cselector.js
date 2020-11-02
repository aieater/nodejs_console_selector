#!/usr/bin/env node

const keypress = require('keypress');
const _readline = require('readline');
const isWin = process.platform === "win32";

CCYAN = isWin ? '' : '\033[0;36m'
CGREEN = isWin ? '' : '\033[0;32m'
CNORMAL = isWin ? '' : ''
CRESET = isWin ? '' : '\033[0m'
CRED = isWin ? '' : '\033[0;31m'
CUNDER = isWin ? '' : '\x1B[4m'
CREVERSE = isWin ? '' : '\x1b[7m'
CRUNDER = isWin ? '' : '\x1B[0m'

var assigned_keypress = false;
function selector(items, _opts) {
  let opts = Object.assign({
    page: 10,
    title: ""
  }, _opts);
  if (opts.title.length) process.stdout.write(opts.title + `\n`);
  // console.log(items);
  opts.page = opts.page < items.length ? opts.page : items.length;
  return new Promise(resolve => {
    if (items.length == 0) {
      resolve(null);
      return;
    }
    let enabled = true;
    let index = 0;
    let page = 0;
    let len = items.length;
    let mlen = 0;
    for (let s of items) {
      mlen = s.length < mlen ? mlen : s.length
    }

    function display() {
      let c = 0;
      let pstr = "Page: ";
      let plen = 0;
      for (let i = page * opts.page;(i < (page + 1) * opts.page) && (i < len); i++) {
        process.stdout.write(`    ${empty()}\r\b`);
        
        process.stdout.write((i == index ? CREVERSE : "") + ` ${i == index ? '=>' : '  '} ${items[i]}${CRUNDER}\n`);
        c++;
      }

      for (let i = opts.page - c; i > 0; i--) {
        process.stdout.write(`    ${empty()}\n`);
      }
      for (let i = 0;(opts.page * i) < len; i++) {
        pstr += page == i ? ` ${CGREEN}${i}${CRESET}` : ` ${CNORMAL}${i}${CRESET}`;
        plen += 1;
      }
      if (plen <= 1) {
        process.stdout.write(`\n`);
      } else {
        process.stdout.write(pstr + `\n`);
      }
    }

    function empty() {
      let ret = "";
      for (let i = 0; i < mlen; i++) ret += " ";
      return ret;
    }

    function back() {
      let c = 0;
      for (let i = page * opts.page;(i < (page + 1) * opts.page) && (i < len); i++) {
        process.stdout.write("\033[2A\n");
        c++;
      }
      for (let i = opts.page - c; i > 0; i--) {
        process.stdout.write("\033[2A\n");
      }
      process.stdout.write("\033[2A\n");
    }
    display();
    // process.stdout.write("\033[1A");
    if (assigned_keypress == false) {
      keypress(process.stdin);
      assigned_keypress = true;
    }
    // const EventEmitter = require('events');
    // console.log(EventEmitter.listenerCount(process.stdin, "data"));
    function klistener(ch, key) {
        if (key) {
          if (key.name == 'up' || key.name == 'k') {
            index = index - 1 < 0 ? 0 : index - 1;
            page = index / opts.page;
            page = parseInt(page);
            back();
            display();
          } else if (key.name == 'down' || key.name == 'j') {
            index = index + 1 < items.length ? index + 1 : items.length - 1;
            page = index / opts.page;
            page = parseInt(page);
            back();
            display();
          } else if (key.name == 'left' || key.name == 'h') {
            index = index - opts.page < 0 ? 0 : index - opts.page;
            page = index / opts.page;
            page = parseInt(page);
            back();
            display();
          } else if (key.name == 'right' || key.name == 'l') {
            index = index + opts.page < items.length ? index + opts.page : items.length - 1;
            page = index / opts.page;
            page = parseInt(page);
            back();
            display();
          } else if (key.name == 'return') {
            // back();
            // display();
            process.stdin.removeListener("keypress", klistener);
            enabled = false;
            process.stdin.pause();
            if (process.stdin.setRawMode) process.stdin.setRawMode(false);
  
            // for (let i = page * opts.page;(i < (page + 1) * opts.page) && (i < len); i++) {
            //   process.stdout.write("\n");
            // }
            process.stdout.write(CCYAN + `    => ${items[index]} \n\n` + CRESET);
            resolve([index, items[index]]);
  
  
          } else if (key && key.ctrl && key.name == 'c') {
            process.stdin.pause();
            if (process.stdin.setRawMode) process.stdin.setRawMode(true);
            resolve(null);
            process.exit(9);
          }
        }
    }
    process.stdin.on('keypress', klistener);
    if (process.stdin.setRawMode) process.stdin.setRawMode(true);
    process.stdin.resume();
  });
}


function yes_or_no(title, _default = true) {
  return new Promise(resolve => {
    const rl = _readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    _default = _default.toString();
    let dy = _default == 'y' || _default == 'yes' || _default == '1' || _default == 'true';
    function ask() {
      let yes_s = `(${CGREEN}Y${CRESET}/n)`;
      let no_s = `(y/${CGREEN}N${CRESET})`;
      rl.question(`${title} ${dy?yes_s:no_s} > `, (a) => {
        a = a.toString().toLowerCase();
        if (a.length == 0) {
          a = _default.toLowerCase();
        }
        let yes = a == 'y' || a == 'yes' || a == '1' || a == 'true';
        let no = a == 'n' || a == 'no' || a == '0' || a == 'false';
        if (yes || no) {
          rl.close();
          process.stdout.write(CCYAN + "    => " + (yes?"Y":"N") + "\n\n" + CRESET);
          resolve(yes);
        } else {
          ask();
        }
      });
    }
    ask();
  });
}

const Writable = require('stream').Writable;

function readline(title, _default=null, _hide=false) {
  return new Promise(resolve => {
    function rec() {
      // process.stdout.clearLine();
      // process.stdout.cursorTo(0);    
      let mutableStdout = null;
      if (_hide) {
        mutableStdout = new Writable({
          write: function(chunk, encoding, callback) {
            if (!this.muted) process.stdout.write(chunk, encoding);
            callback();
          }
        });
        mutableStdout.muted = false;
      }



      const rl = _readline.createInterface({
        input: process.stdin,
        output: mutableStdout?mutableStdout:process.stdout,
        terminal: mutableStdout?true:false
      });
      let dis = `${title} default:(${_default}) > `;
      if (_default == null) {
        dis = `${title} > `
      }
      
      rl.question(dis, (a) => {
        a = a.toString()//.toLowerCase();
        if (a.length == 0) {
          a = _default;
        }
        rl.close();
        if (_hide) {
          process.stdout.write("\n\n");
        } else {
          process.stdout.write(CCYAN + "    => " + a + "\n\n" + CRESET);
        }
        if (a) {
          resolve(a);
        } else {
          rec();
        }
      });
      if (mutableStdout) {
        mutableStdout.muted = true;
      }
    }
    rec();
  });
}


if (require.main === module) {
  (async () => {
    if (0) {
      let ret = await selector(["test", "getet", "getet", "getet"], {
        title: "test"
      });
      console.log(ret);
    }
    if (0) {
      let ret = await yes_or_no("hogehoge?");
      console.log(ret);
    }
    if (1) {
      try {
        let ret = await readline("Batch size?", "128");
        console.log(ret);
      } catch (e) {
        console.log(e);
      }
    }
  })();

  process.on('uncaughtException', function (e) { console.error(e.stack);});

}



module.exports = {
  yes_or_no: yes_or_no,
  selector: selector,
  readline: readline,
};
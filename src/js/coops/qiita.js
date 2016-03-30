const electron = require('electron');
const remote = electron.remote;
const BrowserWindow = remote.BrowserWindow;

const models = require('../models');
const Note = models.Note;
const co = require('../constants');
const ebg = require('../utils/ebg');

const qiitaClientId = ebg(co.slice(0, 40));
const qiitaClientSecret = ebg(co.slice(40, 80));
const qiitaUrl = "https://qiita.com/api/v2/oauth/authorize?" +
  "client_id=" + qiitaClientId + "&" +
  "scope=write_qiita read_qiita";
const qiitaAccessTokenURL = 'https://qiita.com/api/v2/access_tokens';
const qiitaItemsURL = 'https://qiita.com/api/v2/items';

const QIITA_TOKEN_KEY = 'coops.qiita.token';

function setQiitaToken(token) {
  return localStorage.setItem(QIITA_TOKEN_KEY, token);
}

function getQiitaToken() {
  return localStorage.getItem(QIITA_TOKEN_KEY);
}


module.exports = function(Vue, option) {
  Vue.use(require('vue-resource'));
  Vue.use(require('../components/flashmessage'));

  Vue.prototype.$qiitaAuth = function(cb, err) {
    var authWindow = new BrowserWindow(
      {width: 800,
        height: 600,
        fullscreen: false,
        fullscreenable: false});
    authWindow.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
      var matched;
      if(matched = newUrl.match(/\?code=([^&]*)/)) {
        var params = {
          'code': matched[1]
        };
        params[ebg('pyvrag_vq')] = qiitaClientId;
        params[ebg('pyvrag_frperg')] = qiitaClientSecret;

        this.$http.post(qiitaAccessTokenURL, params).then((res) => {
          // success
          setQiitaToken(res.data['token']);
          this.$message('info', 'Login Succeed');
          if (cb) cb(res.data);
        }, (res) => {
          // error
          this.$message('error', 'Login Failed: ' +
            res.status + ' ' + res.data.message);
          if (err) err(res);
        }).catch(() => {
          this.$message('error', 'Connection Error');
        });
        setTimeout(() => {
          authWindow.close();
        }, 0);
      }
    });

    authWindow.on('closed', () => {
      // Cloned
      authWindow = null;
    });
    authWindow.loadURL(qiitaUrl);
  };
  Vue.prototype.$qiitaPost = function(note) {
    var postNote = () => {
      this.$modal(
        'Share on Qiita',
        'Title will be: ' + note.title,
        [{type: 'text', label: 'Tags', placeholder: 'tag1,tag2,tag3', retValue: ''},
          {type: 'checkbox', label: 'Tweet', retValue: true},
          {type: 'checkbox', label: 'Gist', retValue: false},
          {type: 'checkbox', label: 'Private', retValue: false}],
        (prompts) => {
          var tags = [];
          prompts[0].retValue.split(',').forEach((t) => {
            if (t.length > 0) {
              tags.push({name: t});
            }
          });
          if (tags.length == 0) {
            this.$message('error', 'Qiita requires at least one tag :-|', 5000);
            return
          }
          var payload = {
            title: note.title,
            body: note.bodyWithDataURL + '\n\nWrote by [PileMd](https://pilemd.com/)',
            tweet: prompts[1].retValue,
            gist: prompts[2].retValue,
            coediting: false,
            tags: prompts[0].retValue.split(',').map((t) => {return {name: t}}),
            'private': prompts[3].retValue
          };
          var token = getQiitaToken();
          this.$http.post(
            qiitaItemsURL, payload, undefined,
            {headers: {'Authorization': 'Bearer ' + token}}).then(
            (res) => {
              // Success
              var url = res.data.url;
              note.qiitaURL = url;
              Note.setModel(note);
              this.$message('info', 'Posted to Qiita (Click to open)', 5000, url);
            },
            (res) => {
              // Error
              this.$message('error', 'Sorry. Error ' +
                res.status + ' ' + res.data.message, 5000)
            }
          )
        }
      );
    };
    var token = getQiitaToken();
    if (!token) {
      Vue.prototype.$qiitaAuth.call(this, postNote);
    } else {
      postNote();
    }
  };

  Vue.prototype.$qiitaGet = function(note) {

  }
};

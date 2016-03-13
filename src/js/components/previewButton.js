require('./previewButton.css');
const applicationmenu = require('../applicationmenu');
const ApplicationMenu = applicationmenu.ApplicationMenu;

module.exports = function(Vue, options) {
  Vue.component('previewbutton', {
    replace: true,
    props: ['isPreview'],
    template: require('./previewButton.html'),
    created: function() {
      var app = new ApplicationMenu();
      app.setTogglePreview(this.togglePreview)
    },
    methods: {
      togglePreview: function() {
        this.isPreview = !this.isPreview;
        if (this.isPreview) {
          var menu = new ApplicationMenu();
          // FIXME as same as componets/codemirror.js Fucking hell
          menu.setEditSubmenu([
            {
              label: 'Undo',
              accelerator: 'CmdOrCtrl+Z',
              enabled: false
            },
            {
              label: 'Redo',
              accelerator: 'Alt+Z',
              enabled: false
            },
            {
              type: 'separator'
            },
            {
              label: 'Cut',
              accelerator: 'CmdOrCtrl+X',
              role: 'cut'
            },
            {
              label: 'Copy',
              accelerator: 'CmdOrCtrl+C',
              role: 'copy'
            },
            {
              label: 'Paste',
              accelerator: 'CmdOrCtrl+V',
              role: 'paste'
            },
            {
              label: 'Select All',
              accelerator: (function() {
                if (applicationmenu.IS_DARWIN) {
                  return 'Command+A'
                } else {
                  return 'Shift+Ctrl+A'
                }
              })(),
              enabled: false
            },
            {
              type: 'separator'
            },
            {
              label: 'Upload Image...',
              accelerator: (function() {
                if (applicationmenu.IS_DARWIN) {
                  return 'Shift+Command+A'
                } else {
                  return 'Alt+I'
                }
              })(),
              enabled: false
            },
            {
              type: 'separator'
            },
            {
              label: 'Find...',
              accelerator: (function() {
                if (applicationmenu.IS_DARWIN) {
                  return 'Command+F'
                } else {
                  return 'Ctrl+S'
                }
              })(),
              enabled: false
            },
            {
              label: 'Replace...',
              accelerator: (function() {
                if (applicationmenu.IS_DARWIN) {
                  return 'Alt+Command+F'
                } else {
                  return 'Ctrl+R'
                }
              })(),
              enabled: false
            }
          ]);
          menu.setMenu()
        }
      }
    }
  });
};

const path = require('path');
const fs = require('fs');

const Vue = require('vue');
const moment = require('moment');

const ApplicationMenu = require('./applicationmenu').ApplicationMenu;
const models = require('./models');
const initialModels = require('./initialModels');
const preview = require('./preview');
const searcher = require('./searcher');
const co = require('./constants');

// Electron things
const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const dialog = remote.dialog;

const arr = require('./utils/arr');


// Vue.js plugins
Vue.use(require('./components/flashmessage'));
Vue.use(require('./components/modal'));
Vue.use(require('./components/previewButton'));
Vue.use(require('./components/racks'));
Vue.use(require('./components/notes'));
Vue.use(require('./components/codemirror'),
  {imageURL: '', imageParamName: 'image'});
Vue.use(require('./coops/qiita'));

// Loading CSSs
require('../css/materialicons.css');
require('../css/mystyle.css');
require('../css/highlight.css');


// Not to accept image dropping and so on.
// Electron will be show local images without this.
document.addEventListener('dragover', (e) => {
  e.preventDefault();
});
document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
});


new Vue({
  el: '#main-editor',
  template: require('../html/app.html'),
  replace: false,
  data: {
    isFullScreen: false,
    isPreview: false,
    preview: "",
    racks: [],
    editingRack: null,
    folders: [],
    notes: [],
    selectedRackOrFolder: null,
    search: "",
    selectedNote: null,
    draggingNote: null,
    allDragHover: false,
    messages: [],
    modalShow: false,
    modalTitle: 'Title',
    modalDescription: 'description',
    modalPrompts: [],
    modalOkcb: null
  },
  computed: {
    filteredNotes: function() {
      return searcher.searchNotes(this.selectedRackOrFolder, this.search, this.notes);
    }
  },
  created: function() {
    var notes;
    if (!models.getBaseLibraryPath()) {
      // Hey, this is first time.
      // * Setting up directory
      // * Create new notes
      initialModels.initialFolder();
      notes = initialModels.migrateFromLocalStorage();
      if (!notes) {
        notes = initialModels.makeInitialNotes();
      } else {
        Vue.nextTick(() => {
          this.$message('info', 'Migrated data to local file', 4000);
          setTimeout(() => {
            this.$message('info', 'Select File->Move Sync Folder to change the place', 8000);
          }, 4000);
        });
      }
    } else {
      try {
        notes = models.Note.getModelsSync();
      } catch(e) {
        // Broken file or invalid directory
        initialModels.initialFolder();
        notes = initialModels.makeInitialNotes();
        Vue.nextTick(() => {
          this.$message('error', 'Broken data or folder, reverted to pmlibrary at home', 5000);
        });
      }
    }

    if (notes.length == 0) {
      notes = initialModels.makeInitialNotes();
    }
    this.$set('notes', notes);
    // Should select latest selected note.
    this.selectedNote = models.Note.latestUpdatedNote(notes);

    initialModels.makeInitialRacks();
    try {
      var folders = models.Folder.getModelsSync();
      var racks = models.Rack.getModelsSync();
      this.$set('folders', folders);
      this.$set('racks', racks);
    } catch(e) {}  // TODO

    this.$watch('selectedNote.body', () => {
      models.Note.setModel(this.selectedNote);
    });
    this.$watch('selectedNote', () => {
      if (this.isPreview) {
        this.$set('preview', preview.render(this.selectedNote, this));
      }
    });
    this.$watch('isPreview', () => {
      this.$set('preview', preview.render(this.selectedNote, this));
    });

    // Flash message
    this.$on('flashmessage-push', function(message) {
      this.messages.push(message);
      setTimeout(() => {
        this.messages.shift()
      }, message.period)
    });
    // Modal
    this.$on('modal-show', function(modalMessage) {
      this.modalTitle = modalMessage.title;
      this.modalDescription = modalMessage.description;
      this.modalPrompts = modalMessage.prompts;
      this.modalOkcb = modalMessage.okcb;
      this.modalShow = true;
    });
    var app = new ApplicationMenu();
    app.setToggleWidescreen(this.toggleFullScreen);
    app.setAddNewNote(this.addNote);
    app.setImportNotes(this.importNotes);
    app.setMoveSync(this.moveSync);
    app.setOpenExistingSync(this.openSync);
    app.setQiitaLogin(this.qiitaLogin);
    // Save it not to remove
    this.watcher = models.makeWatcher(this.racks, this.folders, this.notes);
  },
  methods: {
    toggleFullScreen: function() { this.isFullScreen = !this.isFullScreen },
    addRack: function() {
      var rack = new models.Rack({name: "", ordering: 0});
      var racks = arr.sortBy(this.racks.slice(), 'ordering', true);
      racks.push(rack);
      racks.forEach((r, i) => {
        r.ordering = i;
        models.Rack.setModel(r);
      });
      this.racks = racks;
      this.editingRack = rack;
    },
    calcSaveUid: function() {
      if (this.selectedRackOrFolder instanceof models.Rack) {
        var f = this.selectedRackOrFolder.folders;
        if (!f || f.length == 0) {
          return null;
        } else {
          return f[0].uid
        }
      } else if (this.selectedRackOrFolder instanceof models.Folder) {
        return this.selectedRackOrFolder.uid;
      } else {
        return null;
      }
    },
    addNote: function() {
      var newNote = models.Note.newEmptyNote(this.calcSaveUid());
      this.notes.unshift(newNote);
      models.Note.setModel(newNote);
      this.selectedNote = newNote;
      this.isPreview = false;

      if (this.search.length > 0) {
        this.search = '';
      }
    },
    addNotes: function(noteTexts) {
      var uid = this.calcSaveUid();
      var newNotes = noteTexts.map((noteText) => {
        return new models.Note({body: noteText, folderUid: uid})
      });
      newNotes.forEach((note) => {
        models.Note.setModel(note);
      });
      this.notes = newNotes.concat(this.notes)
    },
    isSearchAll: function() {
      return this.selectedRackOrFolder === null;
    },
    selectAll: function() {
      this.selectedRackOrFolder = null;
    },
    allDragOver: function(event) {
      if (!this.draggingNote || this.draggingNote.folderUid == null) {
        event.preventDefault();
        return false
      }
      event.preventDefault();
      this.allDragHover = true;
    },
    allDragLeave: function(event) {
      if (!this.draggingNote) {return false}
      this.allDragHover = false;
    },
    dropToAll: function(event) {
      if (!this.draggingNote || this.draggingNote.folderUid == null) {
        event.preventDefault();
        event.stopPropagation();
        return false
      }
      this.allDragHover = false;
      var note = this.draggingNote;
      note.folderUid = null;
      models.Note.setModel(note);

      var s = this.selectedRackOrFolder;
      this.selectedRackOrFolder = null;
      this.draggingNote = null;
      Vue.nextTick(() => {
        this.selectedRackOrFolder = s;
      });
    },
    // Electron methods
    shelfMenu: function() {
      var menu = new Menu();
      menu.append(new MenuItem({label: 'Add Rack', click: () => {this.addRack()}}));
      menu.popup(remote.getCurrentWindow());
    },
    importNotes: function() {
      var notePaths = dialog.showOpenDialog(remote.getCurrentWindow(), {
        title: 'Import Note',
        filters: [{name: 'Markdown', extensions: ['md', 'markdown', 'txt']}],
        properties: ['openFile', 'multiSelections']
      });
      if (!notePaths || notePaths.length == 0) {
        return
      }
      var noteBodies = notePaths.map((notePath) => {
        return fs.readFileSync(notePath, 'utf8');
      });
      this.addNotes(noteBodies);
    },
    moveSync: function() {
      var currentPath = models.getBaseLibraryPath();
      if (!currentPath) {this.$message('error', 'Current Syncing Dir Not found', 5000)}
      var newPath = dialog.showSaveDialog(remote.getCurrentWindow(), {
        title: 'Move Sync Folder',
        defaultPath: path.join(currentPath, 'pmlibrary')
      });
      if (!newPath) {return}
      fs.mkdir(newPath, (err) => {
        if (err) {this.$message('error', 'Folder Already Existed', 5000); return}
        // Copy files
        models.copyData(currentPath, newPath);
        models.setBaseLibraryPath(newPath);
        remote.getCurrentWindow().reload();
      });
    },
    openSync: function() {
      var currentPath = models.getBaseLibraryPath();
      var newPaths = dialog.showOpenDialog(remote.getCurrentWindow(), {
        title: 'Open Existing Sync Folder',
        defaultPath: currentPath || '/',
        properties: ['openDirectory', 'createDirectory']
      });
      if (!newPaths) {return}
      var newPath = newPaths[0];

      models.setBaseLibraryPath(newPath);
      remote.getCurrentWindow().reload();
    },
    qiitaLogin: function() {
      this.$qiitaAuth();
    }
  }
});

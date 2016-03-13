function safeName(name) {
  return name.replace(/[\/\\¥]/g, '-');
}

module.exports = {
  safeName: safeName
};

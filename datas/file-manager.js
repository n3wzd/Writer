let instance = null;

export class FileManager {
  constructor() {
    if (!instance) {
      this.fileIdGenerator = 0;
      this.rootDir = this.createDirectory();
      this.fileMap = new Map();
      this.fileCount = 1;
      this.rootDir.files = [this.createFile("Untitled", "")];
      instance = this;
    }
    return instance;
  }

  generateFileID() {
    return this.fileIdGenerator++;
  }

  getFileById(id) {
    const file = this.fileMap.get(id);
    return file === undefined ? null : file;
  }

  isFileExists(id) {
    return this.getFileById(id) !== null;
  }

  createFile(name = "", text = "", parentDir = null) {
    const file = {
      id: this.generateFileID(),
      name: name,
      parentDir: parentDir === null ? this.rootDir : parentDir,
      text: text,
      htmlRef: null,
    };
    this.registerFileToMap(file);
    return file;
  }

  createDirectory(name = "", parentDir = null) {
    const file = {
      id: this.generateFileID(),
      name: name,
      parentDir: parentDir === null ? this.rootDir : parentDir,
      files: [],
      isFold: false,
    };
    this.registerFileToMap(file);
    return file;
  }

  registerFileToMap(file) {
    if (this.fileMap) {
      this.fileMap.set(file.id, file);
    }
  }

  isDirectory(id) {
    return this.getFileById(id).files !== undefined;
  }

  toggleDirectoryFold(id) {
    const dir = this.getFileById(id);
    dir.isFold = !dir.isFold;
  }

  setDirectoryFold(id, value) {
    const dir = this.getFileById(id);
    dir.isFold = value;
  }

  renameFile(id, name) {
    this.getFileById(id).name = name;
  }

  updateFileText(id, text) {
    this.getFileById(id).text = text;
  }

  addFile(parentId, name, content = "") {
    const file = this.createFile(name, content, this.getFileById(parentId));
    file.parentDir.files.push(file);
    this.fileCount++;
    return file.id;
  }

  addDirectory(parentId, name) {
    const file = this.createDirectory(name, this.getFileById(parentId));
    file.parentDir.files.push(file);
    return file.id;
  }

  deleteFile(id) {
    const file = this.getFileById(id);
    if (this.isDirectory(file.id)) {
      for (const subFile of file.files) {
        this.deleteFile(subFile.id);
      }
    } else {
      this.fileCount--;
    }
    file.parentDir.files = file.parentDir.files.filter((item) => item !== file);
    this.fileMap.delete(id);
  }

  getNearestDir(id) {
    const file = this.getFileById(id);
    return file === null
      ? null
      : this.isDirectory(file.id)
      ? file.id
      : file.parentDir.id;
  }

  moveFile(targetId, goalId) {
    if(targetId !== goalId) {
      const targetFile = this.getFileById(targetId);
      const goalFile = this.getFileById(goalId);
      targetFile.parentDir.files = targetFile.parentDir.files.filter((item) => item !== targetFile);
      if(this.isDirectory(goalId)) {
        goalFile.files.push(targetFile);
        targetFile.parentDir = goalFile;
      } else {
        const goalFiles = goalFile.parentDir.files;
        goalFile.parentDir.files.splice(goalFiles.indexOf(goalFile) + 1, 0, targetFile);
        targetFile.parentDir = goalFile.parentDir;
      }
    }
  }
}

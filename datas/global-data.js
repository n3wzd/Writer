let instance = null;

export class GlobalData {
  constructor() {
    if (!instance) {
      this.editorRowStates = [];
      instance = this;
    }
    return instance;
  }
}

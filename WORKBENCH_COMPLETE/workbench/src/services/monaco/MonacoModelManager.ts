import * as monaco from "monaco-editor";

export class MonacoModelManager {
  private static instance: MonacoModelManager | null = null;
  private models: Map<string, monaco.editor.ITextModel> = new Map();
  private viewStates: Map<string, monaco.editor.ICodeEditorViewState> = new Map();

  private constructor() {}

  public static getInstance(): MonacoModelManager {
    if (!MonacoModelManager.instance) {
      MonacoModelManager.instance = new MonacoModelManager();
    }
    return MonacoModelManager.instance;
  }

  public getOrCreate(filePath: string, content: string, language?: string): monaco.editor.ITextModel {
    const uri = monaco.Uri.file(filePath);
    const key = uri.toString();

    if (this.models.has(key)) {
      return this.models.get(key)!;
    }

    const lang = language || this.detectLanguage(filePath);
    const model = monaco.editor.createModel(content, lang, uri);
    this.models.set(key, model);
    return model;
  }

  public get(filePath: string): monaco.editor.ITextModel | undefined {
    return this.models.get(monaco.Uri.file(filePath).toString());
  }

  public saveViewState(filePath: string, editor: monaco.editor.IStandaloneCodeEditor): void {
    const state = editor.saveViewState();
    if (state) this.viewStates.set(filePath, state);
  }

  public restoreViewState(filePath: string, editor: monaco.editor.IStandaloneCodeEditor): void {
    const state = this.viewStates.get(filePath);
    if (state) editor.restoreViewState(state);
  }

  public disposeModel(filePath: string): void {
    const key = monaco.Uri.file(filePath).toString();
    const model = this.models.get(key);
    if (model) {
      model.dispose();
      this.models.delete(key);
      this.viewStates.delete(filePath);
    }
  }

  private detectLanguage(filePath: string): string {
    if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) return "typescript";
    if (filePath.endsWith(".js") || filePath.endsWith(".jsx")) return "javascript";
    if (filePath.endsWith(".json")) return "json";
    if (filePath.endsWith(".md")) return "markdown";
    if (filePath.endsWith(".html")) return "html";
    if (filePath.endsWith(".css")) return "css";
    if (filePath.endsWith(".ps1")) return "powershell";
    return "plaintext";
  }
}

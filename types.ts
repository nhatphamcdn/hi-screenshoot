
export interface EditorState {
  backgroundColor: string;
  backgroundGradient: string;
  padding: number;
  borderRadius: number;
  shadowBlur: number;
  shadowOpacity: number;
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' | 'Auto';
  showBrowserFrame: boolean;
}

export type Template = {
  id: string;
  name: string;
  preview: string;
  config: Partial<EditorState>;
};

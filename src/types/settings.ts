// src/types/settings.ts
export interface Font {
    id: number;
    name: string;
    description: string | null;
    default_type: boolean;
    created_at: string;
  }
  
  export interface Color {
    id: number;
    name: string;
    hex: string;
    img_color: string | null;
    created_at: string;
  }
  
  export interface Size {
    id: number;
    name: string;
    value: number;
    description: string | null;
    created_at: string;
  }
  
  export interface Settings {
    site: ((string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | Iterable<ReactI18NextChildren>) & (string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode>)) | null | undefined;
    id: number;
    primary_color: Color;
    secondary_color: Color;
    primary_font: Font;
    secondary_font: Font | null;
    font_size_base: Size;
    font_size_small: Size;
    font_size_large: Size;
    updated_at: string;
  }
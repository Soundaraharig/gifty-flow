/// <reference types="vite/client" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'a-scene': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'mindar-image'?: string;
        embedded?: boolean | string;
        'vr-mode-ui'?: string;
        'device-orientation-permission-ui'?: string;
      };
      'a-assets': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'a-camera': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        position?: string;
        'look-controls'?: string;
      };
      'a-entity': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'mindar-image-target'?: string;
        id?: string;
      };
      'a-video': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        width?: string;
        height?: string;
        position?: string;
      };
    }
  }
}

export {};

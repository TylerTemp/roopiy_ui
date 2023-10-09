import { electronAPI } from "../Main/Preload";

declare module '*.jpg';
declare module '*.jpeg';
declare module '*.png';
declare module '*.css';
declare module '*.scss';

declare global {
    interface Window {electronAPI: typeof electronAPI}
}

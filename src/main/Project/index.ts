import { readdirSync } from 'fs'

export const GetList = (): string[] => {
    const result = readdirSync("/home/tyler/Documents/roopiy_ui/temp/projects", { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    console.log(`project list:`, result);
    return result;
};

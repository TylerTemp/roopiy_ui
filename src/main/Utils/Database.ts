import Sqlite from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

interface DbMap {
    [key: string]: Sqlite.Database;
}


const dbMap: DbMap = {};


const CreateTables = (): string => `
CREATE TABLE config (
    key TEXT,
    value TEXT,
    PRIMARY KEY(key)
);

CREATE TABLE frame (
    filePath TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    swappedToPath TEXT,
    PRIMARY KEY(filePath)
);

CREATE TABLE faceLib(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    value TEXT NOT NULL,
    file TEXT,
    fullFile TEXT,
    alias TEXT NOT NULL,
    hide INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE frameFace(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    value TEXT NOT NULL,
    groupId INTEGER NOT NULL,
    frameFilePath TEXT NOT NULL,
    faceLibId INTEGER,
    FOREIGN KEY (frameFilePath) REFERENCES frame (filePath),
    FOREIGN KEY (faceLibId) REFERENCES faceLib (id)
);

CREATE INDEX frameFilePath_frameFilePath ON frameFace (frameFilePath ASC);
`;


const GetOrCreateDatabase = (key: string, asFile: boolean): Sqlite.Database => {
    if(!dbMap[key]) {
        const options = {
            // verbose: console.log,
            fileMustExist: asFile
        };
        const dbTarget = asFile? key: ":memory:";
        console.log(`open db ${dbTarget}(${key})`, options);
        if(asFile) {
            const dirName = dirname(key);
            if(!existsSync(dirName)) {
                console.log(`create dir ${dirName}`);
                mkdirSync(dirName, { recursive: true});
            }
        }
        const db = new Sqlite(dbTarget, options);
        if(!asFile) {
            console.log(`console.log(db.serialize());`)

            db.serialize();

            console.log(`init tables`);
            db.exec(CreateTables());
            console.log(`init tables finished`);
        }
        dbMap[key] = db;
    }

    const db = dbMap[key];
    db.pragma('journal_mode = WAL');
    return db;
}

export const Close = (key: string) => {
    const db = dbMap[key];
    if(db) {
        db.close();
        delete dbMap[key];
    }
}

// export const Backup = (db: Database, file: string): Promise<BackupMetadata> => {
//     const db = dbMap[key];
//     if(db) {
//         return db.backup(key)
//             .then(result => {
//                 delete dbMap[key];
//                 GetOrCreateDatabase(key, true);
//                 return result;
//             })  ;
//     }
//     return Promise.reject(new Error(`db not found: ${key}`));
// }


export interface FrameType {
    filePath: string,
    width: number,
    height: number,
    swappedToPath: string | null,
}


export interface FrameFaceType {
    id: number,
    value: string,
    groupId: number,
    faceLibId: number | null,
    frameFilePath: string,
}


// id INTEGER PRIMARY KEY AUTOINCREMENT,
// value TEXT NOT NULL,
// file TEXT NOT NULL,
// alias TEXT NOT NULL,
// hide BOOLEAN NOT NULL DEFAULT FALSE
export interface FaceLibType {
    id: number,
    value: string,
    file: string,
    fullFile: string,
    alias: string,
    hide: number,
}


export default GetOrCreateDatabase;
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import stream from 'stream';

class Roopiy {

    roopiyProcess: ChildProcessWithoutNullStreams;

    output: string | null;
    ready: boolean = false;

    resolve: ((output: string) => void) | null;

    Init(): void {
        console.log(`start roopiy helper`);
        this.roopiyProcess = spawn('C:\\Users\\Tyler\\Documents\\roopiy_ui\\roopiy_wrapper\\.venv\\Scripts\\python.exe', ['roopiy_wrapper/run.py', 'c:/Users/Tyler/Documents/roopiy/temp']);
        // this.output = "[Roopiy]"

        this.roopiyProcess.stdout.on('data', (data) => {
            const output: string = data.toString();
            if(output.trim() === "ROOPIY:STARTED") {
                this.ready = true;
                return;
            }
            this.output = output;
            // console.log(`Roopiy OUTPUT: ${this.output}`);
            this.resolve?.(output);
            this.resolve = null;
        });

        this.roopiyProcess.stderr.on('data', (data) => {
            // console.error(`Roopiy ERROR:`, data.toString());
        });

        this.roopiyProcess.on('close', (code) => {
            console.log(`Roopiy exited with code ${code}`);
        });
    }

    Send(json: string): Promise<string> {
        this.output = null;
        if(!this.ready) {
            return Promise.reject(new Error("Roopiy not ready"));
        }
        this.roopiyProcess.stdin.write(`${json}\n`);
        const thisRef = this;
        return new Promise<string>((resolve, reject) => {
            thisRef.resolve = resolve;
        });
    }
}

export default new Roopiy();

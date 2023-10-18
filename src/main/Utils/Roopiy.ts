import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import { RoopiyWrapperCmd } from "./Config";

class Roopiy {

    roopiyProcess: ChildProcessWithoutNullStreams;

    // output: string | null;

    ready: boolean = false;

    resolve: ((output: string) => void) | null = null;

    Init(): void {
        console.log(`start roopiy helper`);
        const [roopiyCmd, ...roopiyArgs] = RoopiyWrapperCmd;
        this.roopiyProcess = spawn(roopiyCmd, roopiyArgs);
        // this.output = "[Roopiy]"

        this.roopiyProcess.stdout.on('data', (data) => {
            const output: string = data.toString().trim();
            if(output === "ROOPIY:STARTED") {
                this.ready = true;
                return;
            }
            if(output === '') {
                return;
            }
            // this.output = output;
            // console.log(`Roopiy OUTPUT: ${output.length}`);
            const resolveRef = this.resolve;
            this.resolve = null;
            resolveRef?.(output);
        });

        this.roopiyProcess.stderr.on('data', (data) => {
            console.error(`Roopiy ERROR:`, data.toString());
        });

        this.roopiyProcess.on('close', (code) => {
            console.log(`Roopiy exited with code ${code}`);
        });
    }

    Send(json: string): Promise<string> {
        // this.output = null;
        if(!this.ready) {
            return Promise.reject(new Error("Roopiy not ready"));
        }
        if(this.resolve !== null) {
            return Promise.reject(new Error(`pending promise ${this.resolve}`));
        }

        this.roopiyProcess.stdin.write(`${json}\n`);
        const thisRef = this;
        return new Promise<string>((resolve, reject) => {
            // console.log(`mount promise`, json)
            thisRef.resolve = resolve;
        });
    }
}

export default new Roopiy();

// from https://github.com/developit/greenlet/issues/31#issuecomment-392983449

import * as Comlink from "comlink";

/*
  Usage:
  ```
  import AddWorker from "../utils/add-worker?worker";

  const addWorkerFactory = () => Comlink.wrap(new AddWorker());
  const pool = new WorkerPool(addWorkerFactory)
  pool.doStuff();
  ```
*/

export class WorkerPool {
  workerFactory: () => Comlink.Remote<unknown>;
  poolSize: number;
  used: number;
  pool: Comlink.Remote<unknown>[];
  jobs: any[];

  constructor(
    workerFactory: () => Comlink.Remote<unknown>,
    size = navigator.hardwareConcurrency ?? 4
    // hardwareConcurrency is basically what runtime.NumCPU() is in Golang
  ) {
    let worker = (this.workerFactory = workerFactory)();
    this.poolSize = size;
    this.used = 1;
    this.pool = [worker];
    this.jobs = [];
    for (let i in worker)
      if (
        worker.hasOwnProperty(i) &&
        // @ts-expect-error any type
        typeof worker[i] === "function"
      ) {
        // @ts-expect-error any type
        this[i] = this._method(i); // proxy all methods available on the worker
      }
  }

  _method(name: string) {
    return (...args: any[]) => this._queueJob(name, args);
  }

  _queueJob(method: string, args: any[]) {
    return new Promise((y, n) => {
      this.jobs.push({ method, args, y, n });
      this._nextJob();
    });
  }

  _nextJob() {
    let worker = this.pool.pop();
    if (!worker) {
      if (this.used >= this.poolSize) return;
      this.used++;
      worker = this.workerFactory();
    }
    const job = this.jobs.shift();
    if (!job) return;
    // @ts-expect-error any type
    worker[job.method](...job.args)
      .then(job.y)
      .catch(job.n)
      .finally(() => {
        this.pool.push(worker!);
        this._nextJob();
      });
  }
}

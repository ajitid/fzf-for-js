// modfied version of https://github.com/developit/greenlet/issues/31#issuecomment-392983449

import * as Comlink from "comlink";

/*
  Usage:
  ```
  import AddWorker from "../utils/add-worker?worker";

  const addWorkerFactory = () => Comlink.wrap(new AddWorker());
  const pool = new WorkerPool(addWorkerFactory)
  pool.callFn("fnName")(arg1, arg2);
  ```
*/

export class WorkerPool {
  workerFactory: () => Worker;
  poolSize: number;
  used: number;
  pool: Comlink.Remote<unknown>[];
  jobs: any[];

  constructor(
    workerFactory: () => Worker,
    size = navigator.hardwareConcurrency ?? 4
  ) {
    let worker = (this.workerFactory = workerFactory)();
    this.poolSize = size;
    this.used = 1;
    this.pool = [Comlink.wrap(worker)];
    this.jobs = [];
  }

  callFn(name: string) {
    return (...args: any[]) => this.queueJob(name, args);
  }

  private queueJob(method: string, args: any[]) {
    return new Promise((y, n) => {
      this.jobs.push({ method, args, y, n });
      this.nextJob();
    });
  }

  private nextJob() {
    const job = this.jobs.shift();
    if (!job) return;

    let worker = this.pool.pop();
    if (!worker) {
      if (this.used >= this.poolSize) return;
      this.used++;
      worker = Comlink.wrap(this.workerFactory());
    }

    // @ts-expect-error any type
    worker[job.method](...job.args)
      .then(job.y)
      .catch(job.n)
      .finally(() => {
        this.pool.push(worker!);
        this.nextJob();
      });
  }
}

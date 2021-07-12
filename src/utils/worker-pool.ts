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

  private getWorker() {
    const worker = this.pool.pop();
    if (worker) return worker;

    if (this.used < this.poolSize) {
      this.used++;
      const worker = Comlink.wrap(this.workerFactory());
      return worker;
    }

    return null;
  }

  private nextJob() {
    const job = this.jobs.shift();
    if (!job) return;

    let worker = this.getWorker();
    if (!worker) {
      this.jobs.unshift(job);
      return;
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

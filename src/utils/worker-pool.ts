// from https://github.com/developit/greenlet/issues/31#issuecomment-392983449
export class WorkerPool {
  constructor(workerFactory, size) {
    let worker = (this.workerFactory = workerFactory)();
    this.poolSize = size || 4;
    this.used = 1;
    this.pool = [worker];
    this.jobs = [];
    for (let i in worker)
      if (worker.hasOwnProperty(i) && typeof worker[i] === "function") {
        this[i] = this._method(i); // proxy all methods available on the worker
      }
  }
  _method(name) {
    return (...args) => this._queueJob(name, args);
  }
  _queueJob(method, args) {
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
    worker[job.method](...job.args)
      .then(job.y)
      .catch(job.n)
      .finally(() => {
        this.pool.push(worker);
        this._nextJob();
      });
  }
}

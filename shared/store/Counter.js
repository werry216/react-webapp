import { extendObservable, action, observable, computed } from 'mobx';

export default class Counter {
  constructor(data = {}) {
    extendObservable(this, data);
  }

  @observable count = 0;
  @computed get pretty() { return `Counter is ${this.count}`; }
  @action inc = () => (this.count += 1);
  @action dec = () => (this.count -= 1);
}

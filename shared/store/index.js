import { extendObservable } from 'mobx';
import Counter from './Counter';

export default class Store {
  constructor(data = {}) {
    const { counter, ...rest } = data;
    this.counter = new Counter(counter);
    extendObservable(this, rest);
  }
}

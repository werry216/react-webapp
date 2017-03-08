import { extendObservable } from 'mobx';
import Counter from './Counter';
import getAuth from './Auth';

export default class Store {
  constructor(data = {}) {
    const { counter, auth, ...rest } = data;
    this.counter = new Counter(counter);
    this.auth = getAuth(auth);
    extendObservable(this, rest);
  }
}

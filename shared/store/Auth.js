import { extendObservable, action, observable, computed } from 'mobx';
import callApi from '../utils/apiCaller';

/**
 * Since this is needed for routes this store was made into a singleton
 */
class Auth {
  constructor(data = {}) {
    extendObservable(this, data);
  }

  @observable user;
  @observable errorMessage;

  @computed get isLoggedIn() { return !!this.user; }
  @computed get getError() { return this.errorMessage; }

  @action login = async (username, password) => {
    try {
      const res = await callApi('login', 'POST', { username, password });
      if (res.status !== 403) {
        this.user = res;
      } else {
        this.errorMessage = res.message;
      }
    } catch (err) {
      this.errorMessage = err.message;
    }
  };
  @action logout = () => {
    callApi('logout');
    this.user = null;
  };
  @action loadAuth = user => (this.user = user);
}

let auth;
export default function getAuth(data) {
  if (!auth) {
    auth = new Auth(data);
  }
  return auth;
}

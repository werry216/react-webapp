import { Component, PropTypes } from 'react';
import { observer, inject } from 'mobx-react';

class Logout extends Component {
  static propTypes = {
    auth: PropTypes.object.isRequired,      // eslint-disable-line
    replace: PropTypes.func.isRequired,
  };

  componentWillMount() {
    this.props.auth.logout();
    this.props.replace('/');
  }

  render() {
    return null;
  }
}

export default inject('auth')(observer(Logout));

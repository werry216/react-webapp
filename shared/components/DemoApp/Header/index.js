import React, { Component, PropTypes } from 'react';
import { withRouter } from 'react-router-dom';
import Link from 'react-router-dom/Link';
import { observer, inject } from 'mobx-react';
import Logo from './Logo';
import Menu from './Menu';

class Header extends Component {
  static propTypes = {
    auth: PropTypes.object.isRequired,      // eslint-disable-line
    replace: PropTypes.func.isRequired,      // eslint-disable-line
  };

  onLogout = () => {
    this.props.auth.logout();
    this.props.replace('/');
  }

  render() {
    const isLoggedIn = this.props.auth.isLoggedIn;

    return (
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <Logo />
        <h1>React, Universally</h1>
        <Menu />
        { isLoggedIn ?
          <Link to="/logout" onClick={this.onLogout}>Logout</Link>
          :
          <Link to="/login">Login</Link>
        }
      </div>
    );
  }
}

export default inject('auth')(observer(withRouter(Header)));

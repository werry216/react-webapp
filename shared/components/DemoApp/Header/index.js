import React, { Component, PropTypes } from 'react';
import { withRouter } from 'react-router-dom';
import Link from 'react-router-dom/Link';
import { observer, inject } from 'mobx-react';
import Nav from './Nav';
import logo from './logo.png';
import style from '../structure.scss';
import header from './header.scss';

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
      <div className={header.metabar}>
        <div className={`${style.container} ${style.flexRow} ${style.alignCenter} ${header.top}`}>
          <Logo />
          <div className={style.flexItem} />
          <div>
            { isLoggedIn ?
              <Link to="/logout" onClick={this.onLogout}>Logout</Link>
              :
              <Link to="/login">Login</Link>
            }
          </div>
        </div>
        <div className={`${style.container}`}>
          <Nav />
        </div>
      </div>
    );
  }
}

function Logo() {
  return (
    <div>
      <img src={logo} alt="Logo" style={{ height: '45px', verticalAlign: 'middle' }} />
      <span style={{ lineHeight: '45px', verticalAlign: 'middle' }}>WebNovels</span>
    </div>
  );
}

export default inject('auth')(observer(withRouter(Header)));

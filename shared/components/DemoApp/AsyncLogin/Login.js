import React, { Component, PropTypes } from 'react';
import Helmet from 'react-helmet';
import { observer, inject } from 'mobx-react';
import Redirect from 'react-router-dom/Redirect';

class Login extends Component {
  static propTypes = {
    auth: PropTypes.object,     // eslint-disable-line
    location: PropTypes.object, // eslint-disable-line
  };

  state = {
    redirectToReferrer: false,
  }

  onLogin = async () => {
    const auth = this.props.auth;
    await auth.login('test', 'test');
    this.setState({ redirectToReferrer: true });
  }

  render() {
    const { from } = this.props.location.state || { from: { pathname: '/' } };
    const { redirectToReferrer } = this.state;

    if (redirectToReferrer) {
      return (
        <Redirect to={from} />
      );
    }

    return (
      <article>
        <Helmet title="Counter" />
        <button onClick={this.onLogin}>Login</button>
      </article>
    );
  }
}

export default inject('auth')(observer(Login));

import 'normalize.css/normalize.css';

import React from 'react';
import Switch from 'react-router-dom/Switch';
import Redirect from 'react-router-dom/Redirect';
import Route from 'react-router-dom/Route';

import './globals.scss';

import styles from './index.scss';
import AsyncHome from './AsyncHome';
import AsyncAbout from './AsyncAbout';
import AsyncCounter from './AsyncCounter';
import AsyncLogin from './AsyncLogin';
import AsyncLogout from './AsyncLogout';
import Error404 from './Error404';
import Header from './Header';
import getAuth from '../../store/Auth';

const PrivateRoute = ({ component, ...rest }) => {  // eslint-disable-line
  const auth = getAuth();
  return (
    <Route
      {...rest}
      render={props => (
        auth.isLoggedIn ? (
          React.createElement(component, props)
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: props.location },  // eslint-disable-line
            }}
          />
        ))
      }
    />
  );
};

function DemoApp() {
  return (
    <div className={styles.root}>
      <Header />
      <Switch>
        <Route exact path="/" component={AsyncHome} />
        <Route path="/counter" component={AsyncCounter} />
        <Route path="/login" component={AsyncLogin} />
        <Route path="/logout" component={AsyncLogout} />
        <PrivateRoute path="/about" component={AsyncAbout} />
        <Route component={Error404} />
      </Switch>
    </div>
  );
}

export default DemoApp;

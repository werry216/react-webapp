/* @flow */

import React from 'react';
import Helmet from 'react-helmet';
import { extendObservable } from 'mobx';
import { observer } from 'mobx-react';

class Counter extends React.Component {
  constructor(props) {
    super(props);
    extendObservable(this, {
      count: 0,
    });
    this.inc = this.inc.bind(this);
    this.dec = this.dec.bind(this);
  }

  inc() {
    this.count++;
  }

  dec() {
    this.count--;
  }

  render() {
    return (
      <div style={{ textAlign: 'center' }}>
        <Helmet title="Counter"/>
        <div>{this.count}</div>
        <button onClick={this.inc}>Inc</button>
        {' '}
        <button onClick={this.dec}>Dec</button>
      </div>
    )
  }
}

export default observer(Counter);

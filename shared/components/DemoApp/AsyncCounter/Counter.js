import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';
import { observer, inject } from 'mobx-react';

import style from '../structure.scss';

function Counter({ counter }) {
  return (
    <main role="main">
      <article className={`${style.container}`}>
        <Helmet title="Counter" />
        <div>{counter.pretty}</div>
        <button onClick={counter.inc}>Inc</button>
        {' '}
        <button onClick={counter.dec}>Dec</button>
      </article>
    </main>
  );
}

Counter.propTypes = {
  // eslint-disable-next-line
  counter: PropTypes.object,
};

export default inject('counter')(observer(Counter));

import React, { PropTypes } from 'react';
import Helmet from 'react-helmet';
import { observer, inject } from 'mobx-react';

function Counter({ counter }) {
  return (
    <article>
      <Helmet title="Counter" />
      <div>{counter.pretty}</div>
      <button onClick={counter.inc}>Inc</button>
      {' '}
      <button onClick={counter.dec}>Dec</button>
    </article>
  );
}

Counter.propTypes = {
  // eslint-disable-next-line
  counter: PropTypes.object,
};

export default inject('counter')(observer(Counter));

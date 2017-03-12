import React from 'react';
import Helmet from 'react-helmet';

import config from '../../../../config';
import style from '../structure.scss';

function Home() {
  return (
    <main role="main">
      <Helmet title="Home" />
      <article className={`${style.container}`}>
        <h2>{config('welcomeMessage')}</h2>
        <p>
          This starter kit contains all the build tooling and configuration you
          need to kick off your next universal React project, whilst containing a
          minimal project set up allowing you to make your own architecture
          decisions (Redux/Mobx etc).
        </p>
      </article>
    </main>
  );
}

export default Home;

import React, { PropTypes } from 'react';
import NavLink from 'react-router-dom/NavLink';

import header from '../header.scss';

function NavItem({ to, label }) {
  return (
    <li className={header.navItem}>
      <NavLink to={to} exact activeClassName={header.active}>{ label }</NavLink>
    </li>
  );
}
NavItem.propTypes = {
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

function Nav() {
  return (
    <nav className={header.nav}>
      <ul>
        <NavItem to="/" label="Home" />
        <NavItem to="/counter" label="Counter" />
        <NavItem to="/about" label="About" />
      </ul>
    </nav>
  );
}

export default Nav;

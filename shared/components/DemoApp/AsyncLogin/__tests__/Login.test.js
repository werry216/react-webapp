/* eslint-disable import/no-extraneous-dependencies */

import React from 'react';
import { shallow } from 'enzyme';

import Login from '../Login';
import getAuth from '../../../../store/Auth';

describe('<Login />', () => {
  test('renders', () => {
    const wrapper = shallow(<Login auth={getAuth()} />);
    expect(wrapper).toMatchSnapshot();
  });
});

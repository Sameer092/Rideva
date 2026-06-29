import { combineReducers } from 'redux';
import { Map } from 'immutable';

const initialMap = {
  user: null,
  ready: false,
};

function auth(state = Map(initialMap), action) {
  switch (action.type) {
    case 'SET_USER':
      return state.set('user', action.payload).set('ready', true);
    case 'AUTH_READY':
      return state.set('ready', true);
    default:
      return state;
  }
}

export default combineReducers({ auth });

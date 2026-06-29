import { combineReducers } from 'redux';
import { Map } from 'immutable';

const initialMap = {
  online: false,
  requests: [],
};

function driver(state = Map(initialMap), action) {
  switch (action.type) {
    case 'SET_ONLINE':
      return state.set('online', action.payload);
    case 'SET_REQUESTS':
      return state.set('requests', action.payload);
    default:
      return state;
  }
}

export default combineReducers({ driver });

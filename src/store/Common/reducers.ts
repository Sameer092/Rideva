import { combineReducers } from 'redux';
import { Map } from 'immutable';

const initialMap = {
  currentLocation: null,
  pickup: null,
  dropoff: null,
};

function common(state = Map(initialMap), action) {
  switch (action.type) {
    case 'SET_LOCATION':
      return state.set('currentLocation', action.payload);
    case 'SET_PICKUP':
      return state.set('pickup', action.payload);
    case 'SET_DROPOFF':
      return state.set('dropoff', action.payload);
    case 'RESET_BOOKING':
      return state.set('pickup', null).set('dropoff', null);
    default:
      return state;
  }
}

export default combineReducers({ common });

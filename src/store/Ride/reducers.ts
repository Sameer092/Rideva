import { combineReducers } from 'redux';
import { Map } from 'immutable';

const initialMap = {
  activeRide: null,
  bids: [],
  nearby: [],
};

function ride(state = Map(initialMap), action) {
  switch (action.type) {
    case 'SET_ACTIVE_RIDE':
      return state.set('activeRide', action.payload);
    case 'SET_BIDS':
      return state.set('bids', action.payload);
    case 'SET_NEARBY':
      return state.set('nearby', action.payload);
    default:
      return state;
  }
}

export default combineReducers({ ride });

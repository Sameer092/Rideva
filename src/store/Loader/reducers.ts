import { combineReducers } from 'redux';
import { Map } from 'immutable';

const initialMap = {
  visible: false,
};

function loader(state = Map(initialMap), action) {
  switch (action.type) {
    case 'LOADER_ON':
      return state.set('visible', true);
    case 'LOADER_OFF':
      return state.set('visible', false);
    default:
      return state;
  }
}

export default combineReducers({ loader });

import { combineReducers } from 'redux';
import Loader from '@store/Loader/reducers';
import Auth from '@store/Auth/reducers';
import Common from '@store/Common/reducers';
import Ride from '@store/Ride/reducers';
import Driver from '@store/Driver/reducers';

const appReducer = combineReducers({
  Loader,
  Auth,
  Common,
  Ride,
  Driver,
});

const rootReducer = (state, action) => {
  if (action.type === 'RESET_STATE') {
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;

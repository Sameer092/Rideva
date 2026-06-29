import {
  signIn as signInApi,
  signUp as signUpApi,
  signOut as signOutApi,
  getSession as getSessionApi,
  getCurrentUser as getCurrentUserApi,
  forgotPassword as forgotPasswordApi,
  updateProfile as updateProfileApi,
} from './api';

const setUser = (user) => (dispatch) => {
  dispatch({ type: 'SET_USER', payload: user });
};

const setAuthReady = () => (dispatch) => {
  dispatch({ type: 'AUTH_READY' });
};

const signIn = (credentials) => () => signInApi(credentials);

const signUp = (payload) => () => signUpApi(payload);

const forgotPassword = (email) => () => forgotPasswordApi(email);

const getSession = () => () => getSessionApi();

const loadCurrentUser = () => async (dispatch) => {
  const user = await getCurrentUserApi();
  dispatch({ type: 'SET_USER', payload: user });
  return user;
};

const updateProfile = (userId, updates) => async (dispatch) => {
  const user = await updateProfileApi(userId, updates);
  dispatch({ type: 'SET_USER', payload: user });
  return user;
};

const signOut = () => async (dispatch) => {
  await signOutApi();
  dispatch({ type: 'RESET_STATE' });
  dispatch({ type: 'SET_USER', payload: null });
};

export {
  setUser,
  setAuthReady,
  signIn,
  signUp,
  forgotPassword,
  getSession,
  loadCurrentUser,
  updateProfile,
  signOut,
};

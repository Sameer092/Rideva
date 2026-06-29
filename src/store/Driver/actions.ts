import {
  setStatus as setStatusApi,
  nearbyRequests as nearbyRequestsApi,
  submitBid as submitBidApi,
  updateRideStatus as updateRideStatusApi,
  completeRide as completeRideApi,
} from './api';

const setOnline = (userId, online) => async (dispatch) => {
  await setStatusApi(userId, online ? 'online' : 'offline');
  dispatch({ type: 'SET_ONLINE', payload: online });
};

const loadRequests = () => async (dispatch) => {
  try {
    const requests = await nearbyRequestsApi();
    dispatch({ type: 'SET_REQUESTS', payload: requests });
  } catch (e) {
    dispatch({ type: 'SET_REQUESTS', payload: [] });
  }
};

const submitBid = (rideId, amount) => () => submitBidApi(rideId, amount);

const updateRideStatus = (rideId, status) => () => updateRideStatusApi(rideId, status);

const completeRide = (rideId, distance, duration) => () => completeRideApi(rideId, distance, duration);

export { setOnline, loadRequests, submitBid, updateRideStatus, completeRide };

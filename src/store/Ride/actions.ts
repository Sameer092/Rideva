import {
  estimateFare as estimateFareApi,
  createRide as createRideApi,
  getActiveRide as getActiveRideApi,
  cancelRide as cancelRideApi,
  getRideBids as getRideBidsApi,
  acceptBid as acceptBidApi,
  nearbyDrivers as nearbyDriversApi,
  rate as rateApi,
} from './api';

const setActiveRide = (ride) => (dispatch) => {
  dispatch({ type: 'SET_ACTIVE_RIDE', payload: ride });
};

const loadActiveRide = (userId) => async (dispatch) => {
  const ride = await getActiveRideApi(userId);
  dispatch({ type: 'SET_ACTIVE_RIDE', payload: ride });
  return ride;
};

const loadBids = (rideId) => async (dispatch) => {
  const bids = await getRideBidsApi(rideId);
  dispatch({ type: 'SET_BIDS', payload: bids });
  return bids;
};

const loadNearby = (point, vehicleClass) => async (dispatch) => {
  try {
    const drivers = await nearbyDriversApi(point, vehicleClass);
    dispatch({ type: 'SET_NEARBY', payload: drivers });
  } catch (e) {
    dispatch({ type: 'SET_NEARBY', payload: [] });
  }
};

const estimateFare = (vehicleClass, distance, duration) => () => estimateFareApi(vehicleClass, distance, duration);

const createRide = (payload) => () => createRideApi(payload);

const cancelRide = (rideId, by) => () => cancelRideApi(rideId, by);

const acceptBid = (offerId) => () => acceptBidApi(offerId);

const rate = (rideId, raterId, rateeId, score, comment) => () => rateApi(rideId, raterId, rateeId, score, comment);

export {
  setActiveRide,
  loadActiveRide,
  loadBids,
  loadNearby,
  estimateFare,
  createRide,
  cancelRide,
  acceptBid,
  rate,
};

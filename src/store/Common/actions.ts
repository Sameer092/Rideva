const setLocation = (point) => (dispatch) => {
  dispatch({ type: 'SET_LOCATION', payload: point });
};

const setPickup = (place) => (dispatch) => {
  dispatch({ type: 'SET_PICKUP', payload: place });
};

const setDropoff = (place) => (dispatch) => {
  dispatch({ type: 'SET_DROPOFF', payload: place });
};

const resetBooking = () => (dispatch) => {
  dispatch({ type: 'RESET_BOOKING' });
};

export { setLocation, setPickup, setDropoff, resetBooking };

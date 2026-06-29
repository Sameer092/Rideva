const showHUD = () => (dispatch) => {
  dispatch({ type: 'LOADER_ON' });
};

const hideHUD = () => (dispatch) => {
  dispatch({ type: 'LOADER_OFF' });
};

export { showHUD, hideHUD };

export let io = null;

export const setIO = (serverIO) => {
  io = serverIO;
};

export default {
  get io() {
    return io;
  },
  setIO
};

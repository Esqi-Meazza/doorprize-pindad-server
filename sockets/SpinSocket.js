module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Klien terhubung:", socket.id);

    socket.on("disconnect", () => {
      console.log("Klien terputus:", socket.id);
    });
  });
};
const spinService = require("../services/spinService");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Klien terhubung:", socket.id);

    socket.on("admin-trigger-spin", async (data) => {
      try {
        const result = await spinService.processSpin();
        io.emit("spin-result", result);
      } catch (error) {
        socket.emit("spin-rejected", { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      console.log("Klien terputus:", socket.id);
    });
  });
};
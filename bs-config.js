module.exports = {
    proxy: "http://localhost:3001", // or use a dynamic value
    files: ["views/**/*.ejs"],
    port: 2000,
    ui: {
      port: 3002
    },
    open: false,
    notify: false
};

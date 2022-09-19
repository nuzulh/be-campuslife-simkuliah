// netlify/functions/get-jadwal-background.js
exports.handler = async function(event, context) {
  const { npm, password } = JSON.parse(event.body);
  return {
    statusCode: 200,
    body: JSON.stringify({ npm, password })
  };
};
//# sourceMappingURL=get-jadwal-background.js.map

const net = require('net');

const REMOTE_HOST = 'db.namvzyxzobthykldetii.supabase.co';
const REMOTE_PORT = 6543;
const LOCAL_PORT = 15432;

const server = net.createServer((socket) => {
  console.log(`[${new Date().toISOString()}] Client connected from ${socket.remoteAddress}:${socket.remotePort}`);

  const client = net.createConnection(REMOTE_PORT, REMOTE_HOST, () => {
    console.log(`[${new Date().toISOString()}] Connected to remote: ${REMOTE_HOST}:${REMOTE_PORT}`);
  });

  client.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Remote connection error:`, err.message);
    socket.destroy();
  });

  socket.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Client socket error:`, err.message);
    client.destroy();
  });

  socket.pipe(client);
  client.pipe(socket);

  socket.on('close', () => {
    console.log(`[${new Date().toISOString()}] Client disconnected`);
    client.destroy();
  });

  client.on('close', () => {
    console.log(`[${new Date().toISOString()}] Remote connection closed`);
    socket.destroy();
  });
});

server.listen(LOCAL_PORT, 'localhost', () => {
  console.log(`🔌 Database tunnel running on localhost:${LOCAL_PORT}`);
  console.log(`📍 Forwarding to: ${REMOTE_HOST}:${REMOTE_PORT}`);
  console.log(`⏰ Started at ${new Date().toISOString()}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

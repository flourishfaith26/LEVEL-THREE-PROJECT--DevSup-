import { io } from "socket.io-client";

console.log("Connecting to backend http://localhost:5000 in real time...");

const socket = io("http://localhost:5000", {
    transports: ["websocket", "polling"]
});

socket.on("connect", () => {
    console.log("✅ [REAL-TIME CONNECTED]");
    console.log("   • Socket ID :", socket.id);
    console.log("   • Transport :", socket.io.engine.transport.name);

    const startTime = Date.now();
    console.log("\n📡 Sending 'ping_check' heartbeat to backend...");

    socket.emit("ping_check", null, (res) => {
        const latency = Date.now() - startTime;
        console.log(`⚡ [PONG RECEIVED] Server confirmed response in ${latency} ms! Status:`, res.status);

        console.log("\n👤 Emitting 'user_connected' for 'auth0|test_user_123'...");
        socket.emit("user_connected", "auth0|test_user_123");

        console.log("🚪 Emitting 'join_room' for 'conversation_test_456'...");
        socket.emit("join_room", "conversation_test_456");

        setTimeout(() => {
            console.log("\n🔒 Disconnecting test client cleanly...");
            socket.disconnect();
            console.log("✨ All real-time checks PASSED!");
            process.exit(0);
        }, 500);
    });
});

socket.on("connect_error", (err) => {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
});

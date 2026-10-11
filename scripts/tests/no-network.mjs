import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import { syncBuiltinESMExports } from "node:module";

const blocked = () => {
  throw new Error("Network is disabled in the no-cost test suite");
};

globalThis.fetch = blocked;
http.request = blocked;
http.get = blocked;
https.request = blocked;
https.get = blocked;
net.connect = blocked;
net.createConnection = blocked;
tls.connect = blocked;
syncBuiltinESMExports();

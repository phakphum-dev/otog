import { createEditor, createUserConfig } from "./editor";
import { createServer } from "./server";

if (!globalThis.crossOriginIsolated) {
  document.body.innerHTML =
    'This page requires cross-origin isolation to work properly. You may forget to set server\'s COOP/COEP headers. If you are using this page as an <iframe>, you should also pass <code>allow="cross-origin"</code> to the <code>iframe</code> element.';
  throw new Error("Cross-origin isolation is not enabled");
}

const code = `#include <print>

int main() {
    std::println("Hello, {}!", "world");
}
`;

const enableLsp = true;
const serverWorkerPromise: Promise<Worker> = createServer();

const userConfig = await createUserConfig(code, serverWorkerPromise, enableLsp);

await createEditor(document.getElementById("editor")!, userConfig);

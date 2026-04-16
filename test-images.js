const { ServiceBroker } = require("moleculer");
const moleculerConfig = require("./moleculer.config.js");

const config = {
  ...moleculerConfig,
  nodeID: "test-client",
  logger: false
};

const broker = new ServiceBroker(config);

async function test() {
  try {
    broker.loadServices("./services/", "*.service.js");
    await broker.start();
    
    console.log("1. Populando banco...");
    await broker.call("imagery.readAssets");
    console.log("Pronto!\n");
    
    console.time("10 Imagens");
    for (let i = 0; i < 10; i++) {
      await broker.call("imagery.createImage");
      console.log(`Imagem ${i+1} gerada`);
    }
    console.timeEnd("10 Imagens");
    
  } catch (e) {
    console.error("ERRO:", e.message);
  } finally {
    await broker.stop();
  }
}

test();
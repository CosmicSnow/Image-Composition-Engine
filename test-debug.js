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
    
    console.log("Services:");
    broker.services.forEach((svc, name) => console.log(" -", name));
    
    const imageryService = broker.getLocalService("imagery");
    console.log("\nImagery service:", !!imageryService);
    
    if (imageryService) {
      console.log("Adapter type:", typeof imageryService.adapter);
      const db = imageryService.adapter.db;
      console.log("DB type:", typeof db);
      
      if (db && db.models) {
        const image = await db.models.imagery.findOne({where: {processed: 0}, raw: true});
        if (image) {
          console.log("Combination:", image.combination);
          
          const combinations = image.combination.split(",");
          const fs = require("fs");
          const { resolve } = require("path");
          
          console.log("\nChecking paths:");
          for (let [index, imgName] of combinations.entries()) {
            const p = resolve(`./assets/${index}/${imgName}`);
            console.log(`  ${index}/${imgName}: ${fs.existsSync(p)}`);
          }
        }
      }
    }
    
  } catch (e) {
    console.error("ERRO:", e.message);
    console.error(e.stack);
  } finally {
    await broker.stop();
  }
}

test();
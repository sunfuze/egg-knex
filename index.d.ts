import { Logger } from "egg";
import * as Knex from "knex";
import * as Bluebird from "bluebird";

interface Knex {
  transaction(): Bluebird<Knex.Transaction>;
  get(name: string): Knex;
}

declare module "egg" {
  interface Application {
    knexLogger: Logger;
    knex: Knex & Singleton<Knex>;
  }

  interface EggAppConfig {
    knex: {
      app: boolean;
      agent?: boolean;
      default?: Knex.Config;
      client?: Knex.Config;
      clients?: Record<string, Knex.Config>;
    };
  }
}

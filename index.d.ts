import { Logger } from 'egg';
import * as Knex from 'knex';
import * as Bluebird from 'bluebird';

interface Knex {
  transaction(): Bluebird<Knex.Transaction>;
}

declare module 'egg' {
  interface Application {
    knexLogger: Logger;
    knex: Knex;
    knex: {
      get(name: string): Knex;
    };
  }

  interface Context {
    knex: Knex;
    knex: {
      get(name: string): Knex;
    };
  }

  interface EggAppConfig {
    knex: {
      app: boolean;
      agent: boolean;
      default: Knex.Config;
      client?: Knex.Config;
      clients?: {
        [key: string]: Knex.Config;
      };
    }
  }
}
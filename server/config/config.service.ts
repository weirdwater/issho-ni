import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import * as fs from 'fs';
import { Injectable } from '@nestjs/common'
import { getEnv } from './config.helpers'
import { isNone, doEither } from '../../shared/fun'

export interface EnvConfig {
  [key: string]: string;
}

@Injectable()
export class ConfigService {
  private readonly envConfig: { [key: string]: string }

  constructor(filePath: string) {
    const config = dotenv.parse(fs.readFileSync(filePath));
    this.envConfig = this.validateInput(config);
  }

  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      // See https://docs.nestjs.com/techniques/configuration to add configuration options.
      PG_USER: Joi.string().default('postgres'),
      PG_PASSWORD: Joi.string().required(),
      PG_DATABASE: Joi.string().required(),
      PG_HOST: Joi.string().default('localhost'),
      PG_PORT: Joi.number().default(5432),
      ORM_SYNC: Joi.bool().default(false),
      SENTRY_DSN: Joi.string().required(),
      SENTRY_RELEASE: Joi.string().default(doEither(getEnv('SENTRY_RELEASE'))<string>(_ => 'unreleased', r => r)),
    });

    const { error, value: validatedEnvConfig } = Joi.validate(
      envConfig,
      envVarsSchema,
    );
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return validatedEnvConfig;
  }

  get postgresUser(): string {
    return this.envConfig.PG_USER
  }

  get postgresPassword(): string {
    return this.envConfig.PG_PASSWORD
  }

  get postgresDatabase(): string {
    return this.envConfig.PG_DATABASE
  }

  get postgresHost(): string {
    return this.envConfig.PG_HOST
  }

  get postgresPort(): number {
    return Number(this.envConfig.PG_PORT)
  }

  get typeOrmSync(): boolean {
    return Boolean(this.envConfig.ORM_SYNC)
  }

  get sentryDSN(): string {
    return String(this.envConfig.SENTRY_DSN)
  }

  get sentryRelease(): string {
    return String(this.envConfig.SENTRY_RELEASE)
  }

}
